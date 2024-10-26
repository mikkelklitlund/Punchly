import bcrypt from 'bcrypt'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { User, UserRefreshToken } from 'shared'
import { Result, success, failure } from '../utils/Result'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors'
import { addDays } from 'date-fns'
import { IUserService } from '../interfaces/services/IUserService'
import { IUserRepository } from '../interfaces/repositories/IUserRepository'

export class UserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(email: string, password: string, username: string): Promise<Result<User, Error>> {
    try {
      const emailAlreadyExists = await this.userRepository.getUserByEmail(email)
      if (emailAlreadyExists) {
        return failure(new ValidationError('User with email already exists', 'email'))
      }

      const usernameAlreadyExists = await this.userRepository.getUserByUsername(username)
      if (usernameAlreadyExists) {
        return failure(new ValidationError('User with username already exists', 'username'))
      }

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
  ): Promise<Result<{ accessToken: string; refreshToken: string; user: User }, Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials')
      }

      const accessToken = this.generateAccessToken(user)
      const refreshToken = this.generateRefreshToken(user)

      const expiryDate = addDays(new Date(), 30)
      await this.userRepository.createRefreshToken(user.id, refreshToken, expiryDate)

      return success({ accessToken, refreshToken, user })
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

  async revokeRefreshToken(token: string): Promise<UserRefreshToken> {
    return await this.userRepository.revokeRefreshToken(token)
  }

  private generateAccessToken(user: User): string {
    return jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '15m' })
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' })
  }

  validateAccessToken(token: string): Result<JwtPayload, Error> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      return success(decoded)
    } catch {
      return failure(new Error('Invalid or expired token'))
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<Result<string, Error>> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload

      const user = await this.userRepository.getUserById(decoded.userId)
      if (!user) {
        return failure(new Error('User not found'))
      }

      const storedToken = await this.userRepository.getRefreshToken(refreshToken)
      if (!storedToken || storedToken.revoked || storedToken.expiryDate < new Date()) {
        return failure(new Error('Invalid or expired refresh token'))
      }

      const newAccessToken = this.generateAccessToken(user)
      return success(newAccessToken)
    } catch {
      return failure(new Error('Invalid refresh token'))
    }
  }
}
