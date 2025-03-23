import argon2 from 'argon2'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Role, User, UserRefreshToken } from 'shared'
import { Result, success, failure, Failure } from '../utils/Result.js'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { addDays } from 'date-fns'
import { IUserService } from '../interfaces/services/IUserService.js'
import { IUserRepository } from '../interfaces/repositories/IUserRepository.js'

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

      const hashedPassword = await argon2.hash(password)
      const user = await this.userRepository.createUser(email, hashedPassword, username)
      return success(user)
    } catch (error) {
      console.error('Error creating user:', error)
      return failure(new DatabaseError('Database error during creation of user'))
    }
  }

  async login(
    username: string,
    password: string,
    companyId: number
  ): Promise<
    Result<{ accessToken: string; refreshToken: string; username: string; role: string; companyId: number }, Error>
  > {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user) {
        throw new Error('Invalid username')
      }

      const match = await argon2.verify(user.password, password)
      if (!match) {
        throw new Error('Invalid password')
      }

      const accessRecord = await this.userRepository.getUserCompanyAccess(user.id, companyId)
      if (!accessRecord) {
        throw new Error('User does not have access to this company')
      }

      const userRole = accessRecord.role

      await this.userRepository.revokeAllActiveUserTokens(user.id)

      const accessToken = jwt.sign(
        { username: user.username, companyId, role: userRole },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '15m' }
      )

      const refreshToken = jwt.sign(
        { username: user.username, companyId, role: userRole },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: '30d' }
      )

      const expiryDate = addDays(new Date(), 1)
      await this.userRepository.createRefreshToken(user.id, refreshToken, expiryDate)

      return success({ accessToken, refreshToken, username: user.username, role: userRole, companyId })
    } catch (err) {
      console.log(err)
      return failure(new Error((err as Error).message))
    }
  }

  async getUserByUsername(username: string): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (user) {
        return success(user)
      }
      return failure(new EntityNotFoundError(`User with username: ${username} was not found`))
    } catch (error) {
      console.error('Error fetching user:', error)
      return failure(new DatabaseError('Database error during fetching user by ID'))
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

  async revokeRefreshToken(token: string): Promise<Result<UserRefreshToken, Error>> {
    try {
      const revokedToken = await this.userRepository.revokeRefreshToken(token)
      return success(revokedToken)
    } catch (error) {
      console.error('Error revoking refresh token:', error)
      return failure(new DatabaseError('Failed to revoke refresh token'))
    }
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<Result<{ accessToken: string; refreshToken: string }, Error>> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload

      const user = await this.userRepository.getUserByUsername(decoded.username)
      if (!user) {
        return failure(new Error('User not found'))
      }

      const accessRecord = await this.userRepository.getUserCompanyAccess(user.id, decoded.companyId)
      if (!accessRecord) {
        throw new Error('User does not have access to this company')
      }

      const userRole = accessRecord.role

      const storedToken = await this.userRepository.getRefreshToken(refreshToken)
      if (!storedToken || storedToken.revoked || storedToken.expiryDate < new Date()) {
        return failure(new Error('Invalid or expired refresh token'))
      }

      const newAccessToken = jwt.sign(
        { username: user.username, companyId: decoded.companyId, role: userRole },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: '15m',
        }
      )

      let newRefreshToken: string | undefined = undefined
      const timeUntilExpiry = storedToken.expiryDate.getTime() - Date.now()

      if (timeUntilExpiry < 5 * 60 * 1000) {
        await this.revokeRefreshToken(refreshToken)

        newRefreshToken = jwt.sign({ username: user.username, role: userRole }, process.env.REFRESH_TOKEN_SECRET!, {
          expiresIn: '30d',
        })
        const expiryDate = addDays(new Date(), 1)
        await this.userRepository.createRefreshToken(user.id, newRefreshToken, expiryDate)
      }

      return success({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken ? newRefreshToken : refreshToken,
      })
    } catch {
      return failure(new Error('Invalid refresh token'))
    }
  }

  async userHasAccess(username: string, companyId: number, allowedRoles: Role[]): Promise<Result<true, Error>> {
    const user = await this.getUserByUsername(username)

    if (user instanceof Failure) {
      return failure(new Error('User does not exist'))
    }

    const accessRecord = await this.userRepository.getUserCompanyAccess(user.value.id, companyId)

    if (!accessRecord) {
      return failure(new Error('User does not have access to this company'))
    }

    if (!allowedRoles.includes(accessRecord.role)) {
      return failure(new Error('User does not have the correct role for this company'))
    }

    return success(true)
  }
}
