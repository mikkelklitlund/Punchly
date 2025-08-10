import { Role } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      username?: string
      companyId?: string
      role?: Role
    }
  }
}
