import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest.js'
import { Role } from '@prisma/client'

const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.role) {
      res.status(403).json({ message: 'No role found in request' })
      return
    }

    if (!allowedRoles.includes(req.role)) {
      res.status(403).json({ message: 'Access denied: Insufficient permissions' })
      return
    }

    next()
  }
}

export default authorizeRoles
