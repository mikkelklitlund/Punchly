import { IUserService } from '../interfaces/services/IUserService.js'
import { Failure } from '../utils/Result.js'
import { ValidationError } from '../utils/Errors.js'
import { body, validationResult } from 'express-validator'
import { Router, Response, Request } from 'express'
import authMiddleware from '../middleware/Auth.js'
import { UserDTO } from 'shared'

export class AuthRoutes {
  public router: Router

  constructor(private readonly userService: IUserService) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(
      '/register',
      [
        body('email').isEmail().normalizeEmail(),
        body('password')
          .isLength({ min: 8 })
          .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
          .withMessage('Password must be at least 8 characters long and contain both letters and numbers'),
        body('username').trim().isLength({ min: 3 }).escape(),
      ],
      this.register.bind(this)
    )

    this.router.post(
      '/login',
      [body('username').trim().notEmpty(), body('password').notEmpty(), body('companyId').isNumeric().optional()],
      this.login.bind(this)
    )

    this.router.get('/profile', authMiddleware, this.getProfile.bind(this))

    this.router.post('/refresh', this.refreshToken.bind(this))

    this.router.post('/logout', authMiddleware, this.logout.bind(this))

    this.router.post(
      '/companies-for-user',
      [body('username').trim().notEmpty().isLength({ max: 100 })],
      this.getCompaniesForUser.bind(this)
    )
  }

  private validateRequest(req: Request, res: Response): boolean {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return false
    }
    return true
  }

  private async register(req: Request, res: Response) {
    if (!this.validateRequest(req, res)) return

    const { email, password, username } = req.body
    const result = await this.userService.register(email, password, username)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      res.status(status).json({ error: result.error.message })
      return
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

  private async login(req: Request, res: Response) {
    if (!this.validateRequest(req, res)) return

    const { username, password, companyId } = req.body
    const result = await this.userService.login(username, password, companyId)

    if (result instanceof Failure) {
      res.status(401).json({ error: result.error.message })
      return
    }

    this.setAuthCookies(res, result.value.refreshToken)

    res.json({
      accessToken: result.value.accessToken,
      username: result.value.username,
      role: result.value.role,
      companyId: result.value.companyId,
    })
  }

  private async getProfile(req: Request, res: Response) {
    if (!req.username) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const result = await this.userService.getUserByUsername(req.username)

    if (result instanceof Failure) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const userWithoutPassword: UserDTO = {
      id: result.value.id,
      username: result.value.username,
      email: result.value.email,
      password: null,
    }
    res.json(userWithoutPassword)
  }

  private async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies?.jwt
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token' })
      return
    }

    const result = await this.userService.refreshAccessToken(refreshToken)
    if (result instanceof Failure) {
      res.status(403).json({ error: 'Invalid refresh token' })
      return
    }

    this.setAuthCookies(res, result.value.refreshToken)

    res.json({ accessToken: result.value.accessToken })
  }

  private async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.jwt
      if (refreshToken) {
        await this.userService.revokeRefreshToken(refreshToken)
      }

      this.clearAuthCookies(res)
      res.status(200).json({ message: 'Logged out successfully' })
      res.status(200).json({ message: 'Logged out successfully' })
    } catch {
      this.clearAuthCookies(res)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

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

  private async getCompaniesForUser(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username } = req.body as { username: string }

    try {
      const companies = await this.userService.getCompaniesForUsername(username)
      if (companies instanceof Failure) {
        return res.status(500).json({ message: 'Server error' })
      }

      return res.status(200).json({ companies: companies.value })
    } catch (err) {
      console.error('companies-for-user failed:', err)
      return res.status(500).json({ message: 'Server error' })
    }
  }
}
