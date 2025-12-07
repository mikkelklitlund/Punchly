import { PrismaClient } from '@prisma/client'
import { Logger } from 'pino'

interface PrismaQueryEvent {
  query: string
  params: string
  duration: number
  timestamp: Date
}

interface PrismaLogEvent {
  message: string
  target: string
  timestamp: Date
}

export function attachPrismaLogging(prisma: PrismaClient, logger: Logger) {
  const queryClient = prisma as PrismaClient & {
    $on(eventType: 'query', callback: (e: PrismaQueryEvent) => void): void
    $on(eventType: 'error', callback: (e: PrismaLogEvent) => void): void
    $on(eventType: 'warn', callback: (e: PrismaLogEvent) => void): void
    $on(eventType: 'info', callback: (e: PrismaLogEvent) => void): void
  }

  queryClient.$on('query', (e: PrismaQueryEvent) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(
        {
          query: e.query,
          params: e.params,
          duration: e.duration,
        },
        'Prisma Query'
      )
    }
  })

  queryClient.$on('error', (e: PrismaLogEvent) => {
    logger.error(
      {
        message: e.message,
        target: e.target,
        timestamp: e.timestamp,
      },
      'Prisma Error Event'
    )
  })

  queryClient.$on('warn', (e: PrismaLogEvent) => {
    if (e.message?.includes('Trusting the server certificate')) {
      return
    }

    logger.warn(
      {
        message: e.message,
        target: e.target,
        timestamp: e.timestamp,
      },
      'Prisma Warning'
    )
  })

  queryClient.$on('info', (e: PrismaLogEvent) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info(
        {
          message: e.message,
          target: e.target,
          timestamp: e.timestamp,
        },
        'Prisma Info'
      )
    }
  })

  logger.info('Prisma logging attached successfully')
}
