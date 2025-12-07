import { IUserService } from '../interfaces/services/IUserService.js'
import { Failure } from '../utils/Result.js'
import { ValidationError } from '../utils/Errors.js'
import { Response, Request } from 'express'
import { UserDTO } from 'shared'

export class AuthController {
  constructor(private readonly userService: IUserService) {}

  private setAuthCookies(res: Response, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/api',
      maxAge: 24 * 60 * 60 * 1000,
    })
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production'
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/api',
    })
  }

  public register = async (req: Request, res: Response) => {
    const companyId = req.companyId
    const { email, password, username, shouldChangePassword, role } = req.body

    req.log?.info({ email, username, role, companyId }, 'Attempting new user registration')

    if (!companyId) {
      req.log?.error('CompanyId missing during registration flow')
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }
    const result = await this.userService.register(email, password, username, shouldChangePassword, role, companyId)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500

      if (status === 409) {
        req.log?.warn({ email, error: result.error.message }, 'User registration failed (Conflict)')
      } else {
        req.log?.error({ email, error: result.error.message }, 'User registration failed (Internal Server Error)')
      }
      return res.status(status).json({ error: result.error.message })
    }

    req.log?.info({ userId: result.value.id }, 'User registration successful')

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.value.id,
        email: result.value.email,
        username: result.value.username,
      },
    })
  }

  public login = async (req: Request, res: Response) => {
    const { username, password, companyId } = req.body

    req.log?.info({ username, companyId }, 'Attempting user login')

    const result = await this.userService.login(username, password, companyId)

    if (result instanceof Failure) {
      req.log?.warn({ username, error: result.error.message }, 'Login failed (401 Unauthorized)')
      return res.status(401).json({ error: result.error.message })
    }

    this.setAuthCookies(res, result.value.refreshToken)

    req.log?.info({ userId: result.value.userId, username }, 'User logged in successfully')

    res.json({
      accessToken: result.value.accessToken,
      username: result.value.username,
      role: result.value.role,
      companyId: result.value.companyId,
      shouldChangePassword: result.value.shouldChangePassword,
    })
  }

  public getProfile = async (req: Request, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    req.log?.debug({ userId: req.userId }, 'Fetching user profile')

    const result = await this.userService.getUserById(req.userId)

    if (result instanceof Failure) {
      req.log?.warn({ userId: req.userId }, 'User profile not found after auth check (404)')
      return res.status(404).json({ error: 'User not found' })
    }

    req.log?.debug({ userId: req.userId }, 'User profile fetched successfully')

    const userWithoutPassword: UserDTO = {
      id: result.value.id,
      username: result.value.username,
      email: result.value.email ?? null,
      password: null,
      shouldChangePassword: result.value.shouldChangePassword,
      role: null,
    }
    res.json(userWithoutPassword)
  }

  public refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.jwt
    if (process.env.NODE_ENV !== 'production') {
      req.log.debug({ req }, 'Attempting token refresh')
    }

    if (!refreshToken) {
      req.log?.warn('Refresh token missing from cookies (401)')
      return res.status(401).json({ error: 'No refresh token' })
    }

    const result = await this.userService.refreshAccessToken(refreshToken)
    if (result instanceof Failure) {
      req.log?.warn('Refresh token failed (Invalid or expired token, 403)')
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    this.setAuthCookies(res, result.value.refreshToken)

    if (process.env.NODE_ENV !== 'production') {
      req.log.debug({ req, userId: result.value.userId }, 'Token refreshed successfully')
    }

    res.json({ accessToken: result.value.accessToken })
  }

  public logout = async (req: Request, res: Response) => {
    req.log?.warn({ userId: req.userId }, 'Attempting user logout')

    try {
      const refreshToken = req.cookies?.jwt
      if (refreshToken) {
        await this.userService.revokeRefreshToken(refreshToken)
        req.log?.debug('Refresh token revoked')
      }

      this.clearAuthCookies(res)

      req.log?.info({ userId: req.userId }, 'Logged out successfully')
      res.status(200).json({ message: 'Logged out successfully' })
    } catch (error) {
      req.log?.error({ error }, 'Logout failed unexpectedly')
      this.clearAuthCookies(res)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  public getCompaniesForUser = async (req: Request, res: Response) => {
    const { username } = req.body

    req.log?.debug({ username }, 'Fetching companies for user')

    try {
      const companies = await this.userService.getCompaniesForUsername(username)
      if (companies instanceof Failure) {
        req.log?.error({ username }, 'Failed to get companies from user service')
        return res.status(500).json({ message: 'Server error fetching companies' })
      }

      req.log?.debug({ username, count: companies.value.length }, 'Companies fetched successfully')

      return res.status(200).json({ companies: companies.value })
    } catch (err) {
      req.log?.error({ err, username }, 'companies-for-user route handler failed unexpectedly')
      return res.status(500).json({ message: 'Server error' })
    }
  }

  public changePassword = async (req: Request, res: Response) => {
    const { newPassword } = req.body
    const userId = req.userId

    req.log?.info({ userId }, 'Attempting password change')

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await this.userService.changePassword(userId, newPassword)

    if (result instanceof Failure) {
      const status = result.error.message.includes('incorrect') ? 400 : 500

      if (status === 400) {
        req.log?.warn({ userId, error: result.error.message }, 'Password change failed (Client error)')
      } else {
        req.log?.error({ userId, error: result.error.message }, 'Password change failed (Internal server error)')
      }

      return res.status(status).json({ error: result.error.message })
    }

    req.log?.info({ userId }, 'Password changed successfully')

    res.status(200).json({ message: 'Password changed successfully' })
  }
}
