import type { Options } from 'pino-http'
import { randomUUID } from 'crypto'
import { logger } from '../logger.js'
import { pinoHttp } from 'pino-http'
import type { IncomingMessage, ServerResponse } from 'http'

export const httpLogger = pinoHttp({
  logger,

  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const existing = req.headers['x-request-id'] || req.headers['x-correlation-id']
    const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID()
    res.setHeader('x-request-id', id)
    res.setHeader('x-correlation-id', id)
    return id
  },

  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    if (res.statusCode === 304) return 'debug'
    if (req.url?.includes('/api/auth/refresh') && res.statusCode < 400) return 'debug'
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  },

  autoLogging: {
    ignore: (req: IncomingMessage) => {
      const url = req.url || ''
      return (
        req.method === 'OPTIONS' ||
        url === '/health' ||
        url.startsWith('/api/docs') ||
        url.startsWith('/uploads') ||
        url.includes('favicon.ico')
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
    }),
    err: (err: Error) => ({
      type: err.constructor.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    }),
  },

  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
    return `${req.method} ${req.url} - ${res.statusCode}`
  },

  customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`
  },
} satisfies Options)
