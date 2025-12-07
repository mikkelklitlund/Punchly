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
import { Logger } from 'pino'

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger
  ) {}

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
        this.logger.warn({ username, companyId }, 'Registration failed: username already exists')
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
      this.logger.error({ error, username, companyId }, 'Error creating user during registration')
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
        userId: number
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
        userId: user.id,
      })
    } catch (err) {
      const errorMessage = (err as Error).message
      if (errorMessage.includes('Invalid username') || errorMessage.includes('Invalid password')) {
        this.logger.warn({ username, companyId }, 'Login failed: Invalid credentials')
        return failure(new Error(errorMessage))
      } else if (errorMessage.includes('access to this company')) {
        this.logger.warn({ username, companyId }, 'Login failed: User lacks company access')
        return failure(new Error(errorMessage))
      }
      this.logger.error({ error: err, username, companyId }, 'Error during user login process')
      return failure(new DatabaseError('Database error during login process'))
    }
  }

  async getUserByUsername(username: string): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (user) return success(user)
      this.logger.debug({ username }, 'User not found by username')
      return failure(new EntityNotFoundError(`User with username: ${username} was not found`))
    } catch (error) {
      this.logger.error({ error, username }, 'Database error fetching user by username')
      return failure(new DatabaseError('Database error during fetching user by ID'))
    }
  }

  async getUserById(id: number): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserById(id)
      if (user) return success(user)
      this.logger.debug({ id }, 'User not found by ID')
      return failure(new EntityNotFoundError(`User with id: ${id} was not found`))
    } catch (error) {
      this.logger.error({ error, id }, 'Database error fetching user by ID')
      return failure(new DatabaseError('Database error during fetching user by ID'))
    }
  }

  async updateUser(id: number, companyId: number, data: Partial<Omit<User, 'id'>>): Promise<Result<User, Error>> {
    try {
      const access = await this.userRepository.getUserCompanyAccess(id, companyId)
      if (!access) {
        this.logger.warn({ id, companyId }, 'Update user failed: User lacks company access')
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
      this.logger.error({ error, id, companyId, data }, 'Database error during updating user')
      return failure(new DatabaseError('Database error during updating user'))
    }
  }

  async deleteUser(id: number, companyId: number): Promise<Result<void, Error>> {
    try {
      await this.userRepository.deleteUserCompanyAccess(id, companyId)

      const remainingAccesses = await this.userRepository.getCompaniesForUserId(id)

      if (remainingAccesses.length === 0) {
        this.logger.info({ userId: id }, 'User soft-deleted as last company access was removed')
        await this.userRepository.softDeleteUser(id)
      }

      return success(undefined)
    } catch (error) {
      this.logger.error({ error, id, companyId }, 'Database error during deleting user')
      return failure(new DatabaseError('Database error during deleting user'))
    }
  }

  async revokeRefreshToken(token: string): Promise<Result<UserRefreshToken, Error>> {
    try {
      const revokedToken = await this.userRepository.revokeRefreshToken(token)
      return success(revokedToken)
    } catch (error) {
      this.logger.error({ error }, 'Database error revoking refresh token')
      return failure(new DatabaseError('Failed to revoke refresh token'))
    }
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<Result<{ accessToken: string; refreshToken: string; userId: number }, Error>> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload

      const user = await this.userRepository.getUserByUsername(decoded.username)
      if (!user) {
        this.logger.warn(
          { token: refreshToken, username: decoded.username },
          'Token refresh failed: User not found in DB'
        )
        return failure(new Error('User not found'))
      }

      const accessRecord = await this.userRepository.getUserCompanyAccess(user.id, decoded.companyId)
      if (!accessRecord) {
        this.logger.warn(
          { userId: user.id, companyId: decoded.companyId },
          'Token refresh failed: User lacks company access'
        )
        throw new Error('User does not have access to this company')
      }

      const userRole = accessRecord.role

      const storedToken = await this.userRepository.getRefreshToken(refreshToken)
      const now = new UTCDateMini()
      if (!storedToken || storedToken.revoked || storedToken.expiryDate < now) {
        this.logger.warn(
          {
            userId: user.id,
            isRevoked: storedToken?.revoked,
            isExpired: storedToken?.expiryDate ? storedToken?.expiryDate < now : false,
          },
          'Token refresh failed: Invalid, revoked, or expired token in DB'
        )
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
        this.logger.info({ userId: user.id }, 'Token re-issuance triggered due to short expiry time')
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
        userId: user.id,
      })
    } catch (err) {
      this.logger.warn({ error: err }, 'Token refresh failed due to JWT verification or other uncaught error')
      return failure(new Error('Invalid refresh token'))
    }
  }

  async getAllManagersByCompanyId(companyId: number): Promise<Result<User[], Error>> {
    try {
      const users = await this.userRepository.getUsersByCompanyAndRole(companyId, Role.MANAGER)
      return success(users)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Database error fetching managers by company ID')
      return failure(new DatabaseError('Error in database connection'))
    }
  }

  async getAllUsersByCompanyId(companyId: number): Promise<Result<User[], Error>> {
    try {
      const users = await this.userRepository.getUsersForCompany(companyId)
      return success(users)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Database error fetching all users by company ID')
      return failure(new DatabaseError('Error in database connection'))
    }
  }

  async userHasAccess(username: string, companyId: number, allowedRoles: Role[]): Promise<Result<true, Error>> {
    const userResult = await this.getUserByUsername(username)
    if (userResult instanceof Failure) {
      this.logger.warn({ username, companyId }, 'Access check failed: User does not exist')
      return failure(new Error('User does not exist'))
    }
    const user = userResult.value

    const accessRecord = await this.userRepository.getUserCompanyAccess(user.id, companyId)
    if (!accessRecord) {
      this.logger.warn({ userId: user.id, companyId }, 'Access check failed: User lacks company access')
      return failure(new Error('User does not have access to this company'))
    }

    if (!allowedRoles.includes(accessRecord.role)) {
      this.logger.warn(
        { userId: user.id, companyId, userRole: accessRecord.role, allowedRoles },
        'Access check failed: Incorrect role'
      )
      return failure(new Error('User does not have the correct role for this company'))
    }

    return success(true)
  }

  async getUserCompanyAccesses(userId: number): Promise<Result<Company[], Error>> {
    try {
      const companies = await this.userRepository.getCompaniesForUserId(userId)
      return success(companies)
    } catch (err) {
      this.logger.error({ error: err, userId }, 'Error fetching companies for user')
      return failure(new DatabaseError('Database error while fetching user companies'))
    }
  }

  async getCompaniesForUsername(username: string): Promise<Result<Company[], Error>> {
    try {
      const user = await this.userRepository.getUserByUsername(username)
      if (!user) {
        this.logger.debug({ username }, 'Companies search: User not found, returning empty list')
        return success([])
      }
      const companies = await this.userRepository.getCompaniesForUserId(user.id)
      return success(companies)
    } catch (err) {
      this.logger.error({ error: err, username }, 'Error fetching companies for username')
      return failure(new DatabaseError('Database error while fetching companies for username'))
    }
  }

  async changePassword(userId: number, newPassword: string): Promise<Result<User, Error>> {
    try {
      const user = await this.userRepository.getUserById(userId)

      if (!user) {
        this.logger.warn({ userId }, 'Password change failed: User not found')
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
      this.logger.error({ error: err, userId }, 'Error changing password')
      return failure(new DatabaseError('Database error while changing password.'))
    }
  }
}
