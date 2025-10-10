import { IUserService } from '../interfaces/services/IUserService.js'
import { Failure } from '../utils/Result.js'
import { ValidationError } from '../utils/Errors.js'
import { Response, Request } from 'express'
import { UserDTO } from 'shared'
import { logger } from '../logger.js'

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
    if (!companyId) {
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }
    const { email, password, username, shouldChangePassword, role } = req.body
    const result = await this.userService.register(email, password, username, shouldChangePassword, role, companyId)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      logger.error({ error: result.error.message }, 'User registration failed')
      return res.status(status).json({ error: result.error.message })
    }

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
    const result = await this.userService.login(username, password, companyId)

    if (result instanceof Failure) {
      logger.warn({ username, error: result.error.message }, 'Login failed')
      return res.status(401).json({ error: result.error.message })
    }

    this.setAuthCookies(res, result.value.refreshToken)

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

    const result = await this.userService.getUserById(req.userId)

    if (result instanceof Failure) {
      logger.warn({ userId: req.userId }, 'User profile not found after auth check')
      return res.status(404).json({ error: 'User not found' })
    }

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
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' })
    }

    const result = await this.userService.refreshAccessToken(refreshToken)
    if (result instanceof Failure) {
      logger.warn('Refresh token failed')
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    this.setAuthCookies(res, result.value.refreshToken)
    res.json({ accessToken: result.value.accessToken })
  }

  public logout = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.jwt
      if (refreshToken) {
        await this.userService.revokeRefreshToken(refreshToken)
      }

      this.clearAuthCookies(res)
      res.status(200).json({ message: 'Logged out successfully' })
    } catch (error) {
      logger.error({ error }, 'Logout failed')
      this.clearAuthCookies(res)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  public getCompaniesForUser = async (req: Request, res: Response) => {
    const { username } = req.body

    try {
      const companies = await this.userService.getCompaniesForUsername(username)
      if (companies instanceof Failure) {
        logger.error({ username }, 'Failed to get companies for user service call')
        return res.status(500).json({ message: 'Server error fetching companies' })
      }

      return res.status(200).json({ companies: companies.value })
    } catch (err) {
      logger.error({ err, username }, 'companies-for-user route handler failed')
      return res.status(500).json({ message: 'Server error' })
    }
  }

  public changePassword = async (req: Request, res: Response) => {
    const { newPassword } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await this.userService.changePassword(userId, newPassword)

    if (result instanceof Failure) {
      const status = result.error.message.includes('incorrect') ? 400 : 500
      return res.status(status).json({ error: result.error.message })
    }

    res.status(200).json({ message: 'Password changed successfully' })
  }
}
