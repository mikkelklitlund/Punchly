import { JwtPayload } from 'jsonwebtoken'
import { User } from 'shared'

declare global {
  namespace Express {
    export interface Request {
      user?: string | JwtPayload | User
    }
  }
}
