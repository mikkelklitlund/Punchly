import { Prisma, PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

const prismaLog = logger.child({ module: 'Prisma' })

export function attachPrismaLogging(prisma: PrismaClient) {
  // @ts-expect-error Prisma $on typing bug
  prisma.$on('warn', (e) => prismaLog.warn({ message: e.message, target: e.target }, 'Prisma warn'))
  // @ts-expect-error Prisma $on typing bug
  prisma.$on('error', (e) => prismaLog.error({ message: e.message, target: e.target }, 'Prisma error'))

  if (process.env.NODE_ENV !== 'production') {
    // @ts-expect-error Prisma $on typing bug
    prisma.$on('query', (e) => {
      const event = e as Prisma.QueryEvent
      prismaLog.info(
        {
          query: event.query,
          params: event.params,
          durationMs: event.duration,
          target: event.target,
        },
        'Prisma query'
      )
    })
  }
}
