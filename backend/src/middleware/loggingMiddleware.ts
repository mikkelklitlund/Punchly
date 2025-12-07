import { pinoHttp } from 'pino-http'
import { randomUUID } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Options } from 'pino-http'
import { Logger } from 'pino'

interface ErrorWithCode extends Error {
  code?: string
}

export const createHttpLogger = (logger: Logger) =>
  pinoHttp({
    logger,

    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const forwardedId = req.headers['x-request-id'] || req.headers['x-correlation-id']
      const id = Array.isArray(forwardedId) ? forwardedId[0] : forwardedId || randomUUID()

      res.setHeader('x-request-id', id)
      res.setHeader('x-correlation-id', id)

      return id
    },

    customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (err || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      if (res.statusCode === 304) return 'silent'
      if (req.url?.includes('/api/auth/refresh') && res.statusCode < 400) return 'silent'
      return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    },

    autoLogging: {
      ignore: (req: IncomingMessage) => {
        const url = req.url || ''
        return (
          req.method === 'OPTIONS' ||
          url === '/health' ||
          url.startsWith('/api/docs') ||
          url.startsWith('/api/uploads') ||
          url.includes('favicon.ico') ||
          url.includes('/api/auth/refresh')
        )
      },
    },

    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        remoteAddress: req.socket?.remoteAddress || req.ip,
        userAgent: req.headers['user-agent'],
        user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: process.env.NODE_ENV === 'production' ? undefined : res.getHeaders?.(),
      }),
      err: (err: Error) => {
        const errorWithCode = err as ErrorWithCode
        return {
          type: err.constructor.name,
          message: err.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
          ...(errorWithCode.code && { code: errorWithCode.code }),
        }
      },
    },

    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => `${req.method} ${req.url} - ${res.statusCode}`,
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) =>
      `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`,
  } satisfies Options)
