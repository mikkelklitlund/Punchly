import { Response, NextFunction, Request } from 'express'
import { Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { Failure } from '../utils/Result.js'
import { Response, NextFunction, Request } from 'express'
import { Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { Failure } from '../utils/Result.js'

const authorizeRoles = (userService: IUserService, ...allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.username || !req.companyId || !req.role) {
      req.log?.warn({ allowedRoles }, 'Missing identity on request')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const companyIdNum = Number.parseInt(req.companyId, 10)
    if (Number.isNaN(companyIdNum)) {
      req.log?.warn({ companyId: req.companyId }, 'Invalid companyId on request')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
      const access = await userService.userHasAccess(req.username, companyIdNum, allowedRoles)

      if (access instanceof Failure) {
        req.log?.warn({ error: access.error?.message, allowedRoles }, 'Access check failed')
        return res.status(403).json({ message: access.error.message })
      }

      if (!access.value) {
        req.log?.warn({ role: req.role, allowedRoles }, 'Access denied: insufficient permissions')
        return res.status(403).json({ message: 'Access denied' })
      }

      return next()
    } catch (err) {
      req.log?.error({ err }, 'authorizeRoles error')
      return res.status(500).json({ message: 'Authorization check failed' })
    }
  }
}

export default authorizeRoles
