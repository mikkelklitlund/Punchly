import { Prisma, PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

const prismaLog = logger.child({ module: 'Prisma' })
const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS ?? 250)
const LOG_QUERY_PARAMS = process.env.LOG_QUERY_PARAMS === 'true'

function safeParams(json: string) {
  if (!LOG_QUERY_PARAMS) return undefined
  try {
    const v = JSON.parse(json)
    const mask = (x: unknown): unknown => {
      if (typeof x === 'string') {
        if (x.split('.').length === 3 || x.length > 80 || /^eyJ[A-Za-z0-9_-]+/.test(x)) return '[REDACTED]'
      }
      return x
    }
    return Array.isArray(v) ? v.map(mask) : mask(v)
  } catch {
    return '[unparsed]'
  }
}

export function attachPrismaLogging(prisma: PrismaClient) {
  prisma.$on('warn', (e: Prisma.LogEvent) => prismaLog.warn({ message: e.message, target: e.target }, 'Prisma warn'))
  prisma.$on('error', (e: Prisma.LogEvent) => prismaLog.error({ message: e.message, target: e.target }, 'Prisma error'))

  if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query', (e: Prisma.QueryEvent) => {
      if (e.query === 'SELECT 1') return

      const fields: Record<string, unknown> = {
        query: e.query,
        durationMs: e.duration,
        target: e.target,
      }
      const params = safeParams(e.params)
      if (params !== undefined) fields.params = params

      const slow = e.duration >= SLOW_QUERY_MS
      const msg = slow ? 'Prisma query (slow)' : 'Prisma query'
      ;(slow ? prismaLog.warn.bind(prismaLog) : prismaLog.debug.bind(prismaLog))(fields, msg)
    })
  }
}
