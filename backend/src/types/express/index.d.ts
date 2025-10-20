import { Role } from '@prisma/client'
import type { Logger } from 'pino'

declare global {
  namespace Express {
    interface Request {
      userId?: number
      username?: string
      companyId?: number
      role?: Role

      id?: string
      log: Logger
    }
  }
}
