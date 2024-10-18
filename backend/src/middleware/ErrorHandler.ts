import { NextFunction, Request, Response } from 'express'
import { DatabaseError, EntityNotFoundError, ValidationError } from 'src/utils/Errors'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof EntityNotFoundError) {
    res.status(404).send({ errors: [{ message: err.message }] })
  }

  if (err instanceof ValidationError) {
    res.status(400).send({ errors: [{ message: err.field, field: err.field }] })
  }

  if (err instanceof DatabaseError) {
    res.status(500).send({ errors: [{ message: err.message }] })
  }

  res.status(500).send({ errors: [{ message: 'Something went wrong' }] })
}
