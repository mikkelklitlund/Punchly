import { Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest'
import { Role } from '@prisma/client'

interface AuthJwtPayload extends JwtPayload {
  username: string
  companyId: string
  role: string
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header required' })
    return
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' })
      return
    }

    const payload = decoded as AuthJwtPayload

    if (!payload.username || !payload.companyId || !payload.role) {
      res.status(403).json({ message: 'Invalid token payload' })
      return
    }

    req.username = payload.username
    req.companyId = payload.companyId
    req.role = payload.role as Role

    next()
  })
}

export default authMiddleware
