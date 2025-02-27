import { Role } from '@prisma/client'
import { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  username?: string
  companyId?: string
  role?: Role
}
