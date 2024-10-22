import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { container } from '../inversify.config'
import { IUserService } from '../interfaces/services/IUserService'
import { Failure } from 'src/utils/Result'

const router = express.Router()
const userService = container.get<IUserService>('IUserService')

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('username').notEmpty().withMessage('Username is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { email, password, username } = req.body
    const result = await userService.register(email, password, username)

    if (result instanceof Failure) {
      res.status(500).json({ error: result.error.message })
      return
    }

    res.status(201).json({ user: result.value })
  }
)

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { username, password } = req.body
    const result = await userService.login(username, password)

    if (result instanceof Failure) {
      res.status(401).json({ error: result.error.message })
      return
    }

    res.json({ accessToken: result.value.accessToken, refreshToken: result.value.refreshToken })
  }
)

router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { refreshToken } = req.body
    const result = await userService.refreshAccessToken(refreshToken)

    if (result instanceof Failure) {
      res.status(403).json({ error: 'Invalid refresh token' })
      return
    }

    res.json({ accessToken: result.value, refreshToken: refreshToken })
  }
)

export default router
