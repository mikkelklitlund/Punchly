import { Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest'

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header required' })
    return
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
    if (err) {
      res.sendStatus(403)
      return
    } else if (decoded && typeof decoded !== 'string' && (decoded as JwtPayload).username) {
      req.username = (decoded as JwtPayload).username
      next()
      return
    } else {
      res.status(403).json({ message: 'Invalid token payload' })
      return
    }
  })
}

export default authMiddleware
