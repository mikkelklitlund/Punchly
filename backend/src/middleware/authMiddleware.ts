import { Response, NextFunction, Request } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { Role } from 'shared'

interface AuthJwtPayload extends JwtPayload {
  userId: number
  username: string
  companyId: string | number
  role: Role | string
}

const AUTH_SCHEME = 'Bearer'

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') return next()

  const authHeader = req.headers.authorization
  if (!authHeader) {
    req.log?.warn({ path: req.originalUrl }, 'Missing Authorization header')
    return res.status(401).json({ message: 'Authorization header required' })
  }

  const [schemeRaw, token] = authHeader.split(/\s+/)
  const scheme = schemeRaw?.trim()

  if (!token || !scheme || scheme.toLowerCase() !== AUTH_SCHEME.toLowerCase()) {
    req.log?.warn({ scheme }, 'Invalid auth scheme or empty token')
    return res.status(401).json({ message: 'Invalid Authorization header' })
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, {
      clockTolerance: 5,
    }) as AuthJwtPayload

    const { userId, username, companyId, role } = decoded

    if (
      !userId ||
      typeof userId !== 'number' ||
      !username ||
      !companyId ||
      !role ||
      (typeof companyId !== 'number' && typeof companyId !== 'string')
    ) {
      req.log?.warn('JWT payload missing required claims or invalid types')
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    req.userId = userId
    req.username = username
    req.companyId = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId
    req.role = role as Role

    if (req.log) req.log = req.log.child({ userId, companyId: req.companyId, role })

    return next()
  } catch (err: unknown) {
    let reason: string | undefined
    if (err instanceof Error) reason = err.name
    req.log?.warn({ err: { name: reason } }, 'JWT verify failed')
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default authMiddleware
