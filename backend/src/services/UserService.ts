import bcrypt from 'bcrypt'
import { inject, injectable } from 'inversify'
import jwt from 'jsonwebtoken'
import { User } from 'shared'
import { IUserRepository } from 'src/interfaces/repositories/IUserRepository'
import { IUserService } from 'src/interfaces/services/IUserService'
import { Result, success, failure } from 'src/utils/Result'
import { DatabaseError, EntityNotFoundError, ValidationError } from 'src/utils/Errors'

@injectable()
export class UserService implements IUserService {
  constructor(@inject('IUserRepository') private readonly userRepository: IUserRepository) {}

  async register(email: string, password: string, username: string): Promise<Result<User, Error>> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await this.userRepository.createUser(email, hashedPassword, username)
      return success(user)
    } catch (error) {
      console.error('Error creating user:', error)
      return failure(new DatabaseError('Database error during creation of user'))
    }
  }

  async login(username: string, password: string): Promise<Result<string, Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return failure(new ValidationError('Invalid credentials', 'Password'))
      }

      const secret = process.env.JWT_SECRET
      if (!secret) {
        return failure(new Error('JWT secret is not defined'))
      }

      const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' })
      return success(token)
    } catch (error) {
      console.error('Error verifying user:', error)
      return failure(new DatabaseError('Database error during login'))
    }
  }

  async getUserById(id: number): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserById(id)
      if (user) {
        return success(user)
      }
      return failure(new EntityNotFoundError(`User with id: ${id} was not found`))
    } catch (error) {
      console.error('Error fetching user:', error)
      return failure(new DatabaseError('Database error during fetching user by ID'))
    }
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<Result<User, Error>> {
    try {
      const updatedUser = await this.userRepository.updateUser(id, data)
      return success(updatedUser)
    } catch (error) {
      console.error('Error updating user:', error)
      return failure(new DatabaseError('Database error during updating user'))
    }
  }

  async deleteUser(id: number): Promise<Result<User, Error>> {
    try {
      const deletedUser = await this.userRepository.softDeleteUser(id)
      return success(deletedUser)
    } catch (error) {
      console.error('Error deleting user:', error)
      return failure(new DatabaseError('Database error during deleting user'))
    }
  }
}
