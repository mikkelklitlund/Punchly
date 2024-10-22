import { Request, Response, NextFunction } from 'express'
import { IUserService } from 'src/interfaces/services/IUserService'
import { Failure } from 'src/utils/Result'

const authMiddleware = (userService: IUserService) => (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  const result = userService.validateAccessToken(token)

  if (result instanceof Failure) {
    res.status(403).json({ message: 'Invalid token' })
    return
  }

  req.user = result.value
  next()
}

export default authMiddleware
