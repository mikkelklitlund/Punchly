import { Role } from '@prisma/client'
import type { Logger } from 'pino'

declare global {
  namespace Express {
    interface Request {
      username?: string
      companyId?: string
      role?: Role

      id?: string
      log: Logger
    }
  }
}
