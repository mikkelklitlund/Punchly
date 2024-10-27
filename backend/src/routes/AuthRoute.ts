import { Request, Response, Router } from 'express'
import { IUserService } from '../interfaces/services/IUserService'
import { Failure } from '../utils/Result'
import { ValidationError } from '../utils/Errors'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth'

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

    this.router.get('/profile', authMiddleware(this.userService), this.getProfile.bind(this))
    this.router.post('/refresh-token', body('refreshToken').notEmpty(), this.refreshToken.bind(this))
    this.router.post('/logout', authMiddleware(this.userService), this.logout.bind(this))
  }

  private async register(req: Request, res: Response) {
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

  private async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
      }

      const { username, password } = req.body
      const result = await this.userService.login(username, password)

      if (result instanceof Failure) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      res.cookie('refreshToken', result.value.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })

      res.json({
        accessToken: result.value.accessToken,
        user: {
          id: result.value.user.id,
          username: result.value.user.username,
          email: result.value.user.email,
        },
      })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async getProfile(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const result = await this.userService.getUserById(req.user.id)

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

  private async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' })
        return
      }

      const result = await this.userService.refreshAccessToken(refreshToken)

      if (result instanceof Failure) {
        res.status(403).json({ error: 'Invalid refresh token' })
        return
      }

      res.json({ accessToken: result.value })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken

      if (refreshToken) {
        await this.userService.revokeRefreshToken(refreshToken)
      }

      res.clearCookie('refreshToken')
      res.json({ message: 'Logged out successfully' })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
