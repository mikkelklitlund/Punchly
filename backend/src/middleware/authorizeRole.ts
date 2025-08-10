import { Response, NextFunction, Request } from 'express'
import { Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { Failure } from '../utils/Result.js'

const authorizeRoles = (userService: IUserService, ...allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.username || !req.companyId || !req.role) {
      res.status(403).json({ message: 'Unauthorized: Missing credentials' })
      return
    }

    const access = await userService.userHasAccess(req.username, parseInt(req.companyId), allowedRoles)

    if (access instanceof Failure) {
      res.status(403).json({ message: access.error.message })
      return
    }

    if (!access.value) {
      res.status(403).json({ message: 'Access denied: Insufficient permissions' })
      return
    }

    next()
  }
}

export default authorizeRoles
