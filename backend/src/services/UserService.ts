import argon2 from 'argon2'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Result, success, failure, Failure } from '../utils/Result.js'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { IUserService } from '../interfaces/services/IUserService.js'
import { IUserRepository } from '../interfaces/repositories/IUserRepository.js'
import { Company, User, UserRefreshToken } from '../types/index.js'
import { Role } from 'shared'
import { UTCDateMini } from '@date-fns/utc'
import { addDays } from 'date-fns'

export class UserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(
    email: string | undefined,
    password: string,
    username: string,
    shouldChangePassword: boolean,
    role: Role,
    companyId: number
  ): Promise<Result<User, Error>> {
    try {
      const usernameAlreadyExists = await this.userRepository.getUserByUsername(username)
      if (usernameAlreadyExists) {
        return failure(new ValidationError('User with username already exists', 'username'))
      }

      const hashedPassword = await argon2.hash(password)
      const user = await this.userRepository.createUser(
        email,
        hashedPassword,
        username,
        shouldChangePassword,
        role,
        companyId
      )
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
    Result<
      {
        accessToken: string
        refreshToken: string
        username: string
        role: string
        companyId: number
        shouldChangePassword: boolean
      },
      Error
    >
  > {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user) throw new Error('Invalid username')

      const match = await argon2.verify(user.password, password)
      if (!match) throw new Error('Invalid password')

      const accessRecord = await this.userRepository.getUserCompanyAccess(user.id, companyId)
      if (!accessRecord) throw new Error('User does not have access to this company')

      const userRole = accessRecord.role

      await this.userRepository.revokeAllActiveUserTokens(user.id)

      const accessToken = jwt.sign(
        { username: user.username, companyId, role: userRole, userId: user.id },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '15m' }
      )

      const refreshToken = jwt.sign(
        { username: user.username, companyId, role: userRole, userId: user.id },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: '30d' }
      )

      const expiryDate = addDays(new UTCDateMini(), 1)
      await this.userRepository.createRefreshToken(user.id, refreshToken, expiryDate)

      return success({
        accessToken,
        refreshToken,
        username: user.username,
        role: userRole,
        companyId,
        shouldChangePassword: user.shouldChangePassword,
      })
    } catch (err) {
      console.log(err)
      return failure(new Error((err as Error).message))
    }
  }

  async getUserByUsername(username: string): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (user) return success(user)
      return failure(new EntityNotFoundError(`User with username: ${username} was not found`))
    } catch (error) {
      console.error('Error fetching user:', error)
      return failure(new DatabaseError('Database error during fetching user by ID'))
    }
  }

  async getUserById(id: number): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserById(id)
      if (user) return success(user)
      return failure(new EntityNotFoundError(`User with id: ${id} was not found`))
    } catch (error) {
      console.error('Error fetching user:', error)
      return failure(new DatabaseError('Database error during fetching user by ID'))
    }
  }

  async updateUser(id: number, companyId: number, data: Partial<Omit<User, 'id'>>): Promise<Result<User, Error>> {
    try {
      const access = await this.userRepository.getUserCompanyAccess(id, companyId)
      if (!access) {
        return failure(new EntityNotFoundError('User does not belong to this company'))
      }
      const userPatch: Partial<Omit<User, 'id'>> = {
        ...data,
        password: data.password ? await argon2.hash(data.password) : undefined,
      }
      const updatedUser = await this.userRepository.updateUser(id, userPatch)

      if (data.role) {
        await this.userRepository.updateCompanyRole(id, companyId, data.role)
      }

      return success(updatedUser)
    } catch (error) {
      console.error('Error updating user:', error)
      return failure(new DatabaseError('Database error during updating user'))
    }
  }

  async deleteUser(id: number, companyId: number): Promise<Result<void, Error>> {
    try {
      await this.userRepository.deleteUserCompanyAccess(id, companyId)

      const remainingAccesses = await this.userRepository.getCompaniesForUserId(id)

      if (remainingAccesses.length === 0) {
        await this.userRepository.softDeleteUser(id)
      }

      return success(undefined)
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
      if (!user) return failure(new Error('User not found'))

      const accessRecord = await this.userRepository.getUserCompanyAccess(user.id, decoded.companyId)
      if (!accessRecord) throw new Error('User does not have access to this company')

      const userRole = accessRecord.role

      const storedToken = await this.userRepository.getRefreshToken(refreshToken)
      const now = new UTCDateMini()
      if (!storedToken || storedToken.revoked || storedToken.expiryDate < now) {
        return failure(new Error('Invalid or expired refresh token'))
      }

      const newAccessToken = jwt.sign(
        { username: user.username, companyId: decoded.companyId, role: userRole, userId: user.id },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '15m' }
      )

      let newRefreshToken: string | undefined
      const timeUntilExpiryMs = storedToken.expiryDate.getTime() - now.getTime()

      if (timeUntilExpiryMs < 5 * 60 * 1000) {
        await this.revokeRefreshToken(refreshToken)

        newRefreshToken = jwt.sign(
          { username: user.username, companyId: decoded.companyId, role: userRole, userId: user.id },
          process.env.REFRESH_TOKEN_SECRET!,
          { expiresIn: '30d' }
        )

        const expiryDate = addDays(new UTCDateMini(), 1)
        await this.userRepository.createRefreshToken(user.id, newRefreshToken, expiryDate)
      }

      return success({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken ?? refreshToken,
      })
    } catch {
      return failure(new Error('Invalid refresh token'))
    }
  }

  async getAllManagersByCompanyId(companyId: number): Promise<Result<User[], Error>> {
    try {
      const users = await this.userRepository.getUsersByCompanyAndRole(companyId, Role.MANAGER)
      return success(users)
    } catch {
      return failure(new Error('Error in database connection'))
    }
  }

  async getAllUsersByCompanyId(companyId: number): Promise<Result<User[], Error>> {
    try {
      const users = await this.userRepository.getUsersForCompany(companyId)
      return success(users)
    } catch {
      return failure(new Error('Error in database connection'))
    }
  }

  async userHasAccess(username: string, companyId: number, allowedRoles: Role[]): Promise<Result<true, Error>> {
    const user = await this.getUserByUsername(username)
    if (user instanceof Failure) return failure(new Error('User does not exist'))

    const accessRecord = await this.userRepository.getUserCompanyAccess(user.value.id, companyId)
    if (!accessRecord) return failure(new Error('User does not have access to this company'))

    if (!allowedRoles.includes(accessRecord.role)) {
      return failure(new Error('User does not have the correct role for this company'))
    }

    return success(true)
  }

  async getUserCompanyAccesses(userId: number): Promise<Result<Company[], Error>> {
    try {
      const companies = await this.userRepository.getCompaniesForUserId(userId)
      return success(companies)
    } catch (err) {
      console.error('Error fetching companies for user:', err)
      return failure(new DatabaseError('Database error while fetching user companies'))
    }
  }

  async getCompaniesForUsername(username: string): Promise<Result<Company[], Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user) return success([])
      const companies = await this.userRepository.getCompaniesForUserId(user.id)
      return success(companies)
    } catch (err) {
      console.error('Error fetching companies for username:', err)
      return failure(new DatabaseError('Database error while fetching companies for username'))
    }
  }

  async changePassword(userId: number, newPassword: string): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserById(userId)

      if (!user) {
        return failure(new ValidationError('User not found.'))
      }

      const hashedNewPassword = await argon2.hash(newPassword)

      const updatedUser = await this.userRepository.updateUser(userId, {
        password: hashedNewPassword,
        shouldChangePassword: false,
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser
      return success(userWithoutPassword as User)
    } catch (err) {
      console.error('Error changing password:', err)
      return failure(new DatabaseError('Database error while changing password.'))
    }
  }
}
