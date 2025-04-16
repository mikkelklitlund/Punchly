import { NextFunction, Request, Response } from 'express'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof EntityNotFoundError) {
    res.status(404).send({ errors: [{ message: err.message }] })
  } else if (err instanceof ValidationError) {
    res.status(400).send({ errors: [{ message: err.field, field: err.field }] })
  } else if (err instanceof DatabaseError) {
    res.status(500).send({ errors: [{ message: err.message }] })
  } else {
    res.status(500).send({ errors: [{ message: 'Something went wrong' }] })
  }
}
