import { Request, Response, Router } from 'express'
import { IUserService } from '../interfaces/services/IUserService'
import { Failure } from '../utils/Result'

export class AuthRoutes {
  public router: Router

  constructor(private readonly userService: IUserService) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post('/register', this.register.bind(this))
    this.router.post('/login', this.login.bind(this))
    this.router.post('/refresh-token', this.refreshToken.bind(this))
  }

  private async register(req: Request, res: Response) {
    const { email, password, username } = req.body
    const result = await this.userService.register(email, password, username)

    if (result instanceof Failure) {
      res.status(500).json({ error: result.error.message })
      return
    }

    res.status(201).json({ user: result.value })
  }

  private async login(req: Request, res: Response) {
    const { username, password } = req.body
    const result = await this.userService.login(username, password)

    if (result instanceof Failure) {
      res.status(401).json({ error: result.error.message })
      return
    }

    res.json({ accessToken: result.value.accessToken, refreshToken: result.value.refreshToken })
  }

  private async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body
    const result = await this.userService.refreshAccessToken(refreshToken)

    if (result instanceof Failure) {
      res.status(403).json({ error: 'Invalid refresh token' })
      return
    }

    res.json({ accessToken: result.value, refreshToken: refreshToken })
  }
}
