import { Response, NextFunction, Request } from 'express'
import { Failure } from '../utils/Result'
import { IUserService } from '../interfaces/services/IUserService'
import { JwtPayload } from 'jsonwebtoken'

const authMiddleware = (userService: IUserService) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization header required' })
      return
    }

    const token = authHeader.split(' ')[1]
    const result = userService.validateAccessToken(token)

    if (result instanceof Failure) {
      res.status(401).json({ message: 'Invalid or expired token' })
      return
    }

    const payload = result.value as JwtPayload
    const userResult = await userService.getUserById(payload.userId)

    if (userResult instanceof Failure) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    req.user = userResult.value
    next()
  } catch {
    res.status(500).json({ message: 'Authentication error' })
  }
}

export default authMiddleware
