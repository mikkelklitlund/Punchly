import { Response, NextFunction, Request } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { Role } from 'shared'

interface AuthJwtPayload extends JwtPayload {
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

    const username = decoded.username
    const companyIdNum = Number.parseInt(String(decoded.companyId), 10)
    const role = (decoded.role as Role) ?? undefined

    if (!username || Number.isNaN(companyIdNum) || !role) {
      req.log?.warn('JWT payload missing required claims')
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    req.username = username
    req.companyId = String(companyIdNum)
    req.role = role

    if (req.log) req.log = req.log.child({ userId: username, companyId: companyIdNum, role })

    return next()
  } catch (err: unknown) {
    let reason: string | undefined
    if (err instanceof Error) reason = err.name
    req.log?.warn({ err: { name: reason } }, 'JWT verify failed')
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default authMiddleware
