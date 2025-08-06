import { Response, NextFunction, Request } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Role } from 'shared'

interface AuthJwtPayload extends JwtPayload {
  username: string
  companyId: string
  role: string
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
      res.status(401).json({ message: 'Authorization header required' })
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as AuthJwtPayload

    if (!decoded.username || !decoded.companyId || !decoded.role) {
      res.status(401).json({ message: 'Invalid token payload' })
      return
    }

    req.username = decoded.username
    req.companyId = decoded.companyId
    req.role = decoded.role as Role

    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
    return
  }
}

export default authMiddleware
