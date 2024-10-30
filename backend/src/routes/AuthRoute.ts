import { IUserService } from '../interfaces/services/IUserService'
import { Failure } from '../utils/Result'
import { ValidationError } from '../utils/Errors'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest'
import { Router, Response } from 'express'

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

    this.router.post('/login', [body('username').trim().notEmpty(), body('password').notEmpty()], this.login.bind(this))

    this.router.get('/profile', authMiddleware, this.getProfile.bind(this))
    this.router.get('/refresh', this.refreshToken.bind(this))
    this.router.post('/logout', authMiddleware, this.logout.bind(this))
  }

  private async register(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
      }

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
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async login(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
      }

      const { username, password } = req.body
      const result = await this.userService.login(username, password)

      if (result instanceof Failure) {
        res.status(401).json({ error: result.error.message })
        return
      }

      res.cookie('jwt', result.value.refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      })

      res.json({
        accessToken: result.value.accessToken,
        username: result.value.user.username,
      })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.username) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const result = await this.userService.getUserByUsername(req.username)

      if (result instanceof Failure) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = result.value
      res.json(userWithoutPassword)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async refreshToken(req: AuthenticatedRequest, res: Response) {
    try {
      const cookie = req.cookies

      if (!cookie?.jwt) {
        res.status(401).json({ error: 'No refresh token' })
        return
      }

      const result = await this.userService.refreshAccessToken(cookie.jwt)
      if (result instanceof Failure) {
        res.status(403).json({ error: 'Invalid refresh token' })
        return
      }

      res.cookie('jwt', result.value.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      })

      res.json({ accessToken: result.value.accessToken })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const refreshToken = req.cookies.jwt

      if (refreshToken) {
        await this.userService.revokeRefreshToken(refreshToken)
      }

      res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
      })
      res.status(204).json({ message: 'Logged out successfully' })
    } catch {
      res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
