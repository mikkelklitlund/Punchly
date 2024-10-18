export type Result<T, E> = Success<T> | Failure<E>

export class Success<T> {
  constructor(public value: T) {}
}

export class Failure<E> {
  constructor(public error: E) {}
}

export const success = <T>(value: T): Result<T, never> => new Success(value)
export const failure = <E>(error: E): Result<never, E> => new Failure(error)
