import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: 'Access denied, no token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' })
      return
    }
    res.status(400).json({ message: 'Invalid token' })
  }
}
