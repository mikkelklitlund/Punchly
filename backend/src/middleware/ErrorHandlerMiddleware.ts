import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error(
    {
      err,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    'Request error'
  )

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Unique constraint violation',
          field: err.meta?.target,
        })
      case 'P2003':
        return res.status(400).json({
          error: 'Foreign key constraint violation',
          field: err.meta?.field_name,
        })
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
        })
      default:
        req.log.error({ code: err.code, meta: err.meta }, 'Prisma error')
        return res.status(400).json({
          error: 'Database error',
          code: err.code,
        })
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Validation error',
      message: process.env.NODE_ENV === 'production' ? 'Invalid request data' : err.message,
    })
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}
