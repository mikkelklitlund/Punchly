export class ValidationError extends Error {
  constructor(
    public message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class DatabaseError extends Error {
  constructor(public message: string) {
    super(message)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

export class EntityNotFoundError extends Error {
  constructor(public message: string) {
    super(message)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}
