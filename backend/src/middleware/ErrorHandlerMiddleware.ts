import { NextFunction, Request, Response } from 'express'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { logger as baseLogger } from '../logger.js'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const log = req.log ?? baseLogger

  log.error(
    {
      err,
      reqId: req.id,
      method: req.method,
      url: req.originalUrl,
    },
    'Unhandled error'
  )

  if (err instanceof EntityNotFoundError) {
    res.status(404).send({ errors: [{ message: err.message }] })
  } else if (err instanceof ValidationError) {
    res.status(400).send({ errors: [{ message: err.message, field: err.field }] })
  } else if (err instanceof DatabaseError) {
    res.status(500).send({
      errors: [{ message: process.env.NODE_ENV === 'production' ? 'Database error' : err.message }],
    })
  } else {
    res.status(500).send({
      errors: [
        {
          message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
        },
      ],
    })
  }
}
