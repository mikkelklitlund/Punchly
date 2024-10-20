import bcrypt from 'bcrypt'
import { inject, injectable } from 'inversify'
import jwt from 'jsonwebtoken'
import { User } from 'shared'
import { IUserRepository } from 'src/interfaces/repositories/IUserRepository'
import { IUserService } from 'src/interfaces/services/IUserService'
import { Result, success, failure } from 'src/utils/Result'
import { DatabaseError, EntityNotFoundError } from 'src/utils/Errors'
import { JwtPayload } from 'src/types/jwt'

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

  async login(
    username: string,
    password: string
  ): Promise<Result<{ accessToken: string; refreshToken: string }, Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials')
      }

      const accessToken = jwt.sign({ userId: user.id } as JwtPayload, process.env.JWT_SECRET!, { expiresIn: '30m' })
      const refreshToken = jwt.sign({ userId: user.id } as JwtPayload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      })

      return success({ accessToken, refreshToken })
    } catch {
      return failure(new Error('Login failed'))
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
