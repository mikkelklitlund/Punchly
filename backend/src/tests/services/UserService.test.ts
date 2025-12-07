import { describe, test, expect, beforeEach, beforeAll, vi } from 'vitest'
import { UserService } from '../../services/UserService.js'
import type { IUserRepository } from '../../interfaces/repositories/IUserRepository.js'
import { mockLogger, mockRepo } from '../setup/get_mocks.js'
import { Company, User, UserCompanyAccess, UserRefreshToken } from '../../types/index.js'
import { Role } from 'shared'
import { Failure, Success } from '../../utils/Result.js'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../../utils/Errors.js'

const mockArgon2 = vi.hoisted(() => ({
  verify: vi.fn(),
  hash: vi.fn(),
}))

const mockJwt = vi.hoisted(() => ({
  sign: vi.fn(),
  verify: vi.fn(),
}))

const mockDateFns = vi.hoisted(() => ({
  addDays: vi.fn(),
}))

vi.mock('argon2', () => ({
  default: mockArgon2,
}))

vi.mock('jsonwebtoken', () => ({
  default: mockJwt,
}))

vi.mock('date-fns', () => mockDateFns)

const mockUserRepository = mockRepo<IUserRepository>()

const USER: User = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedPassword123',
  username: 'testuser',
  shouldChangePassword: false,
  role: Role.ADMIN,
}

const USER_COMPANY_ACCESS: UserCompanyAccess = {
  userId: 1,
  companyId: 101,
  role: Role.ADMIN,
}

const USER_REFRESH_TOKEN: UserRefreshToken = {
  id: 1,
  token: 'mock-refresh-token',
  userId: 1,
  expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
  revoked: false,
  createdAt: new Date(),
}

const COMPANY: Company = {
  id: 101,
  name: 'Test Company',
}

describe('UserService', () => {
  let service: UserService

  beforeAll(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test_access_secret'
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    service = new UserService(mockUserRepository, mockLogger)

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24)
    mockDateFns.addDays.mockReturnValue(futureDate)
  })

  test('should successfully log in a user with valid credentials', async () => {
    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
    mockUserRepository.revokeAllActiveUserTokens.mockResolvedValue(undefined)
    mockUserRepository.createRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    const result = await service.login('testuser', 'password123', 101)

    expect(result instanceof Success).toBe(true)

    if (result instanceof Success) {
      expect(result.value).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        username: USER.username,
        role: USER_COMPANY_ACCESS.role,
        companyId: USER_COMPANY_ACCESS.companyId,
        shouldChangePassword: USER.shouldChangePassword,
        userId: USER.id,
      })
    }

    expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith('testuser')
    expect(mockArgon2.verify).toHaveBeenCalledWith(USER.password, 'password123')
    expect(mockUserRepository.getUserCompanyAccess).toHaveBeenCalledWith(USER.id, 101)
    expect(mockUserRepository.revokeAllActiveUserTokens).toHaveBeenCalledWith(USER.id)
    expect(mockUserRepository.createRefreshToken).toHaveBeenCalledWith(USER.id, 'mock_refresh_token', expect.any(Date))
    expect(mockJwt.sign).toHaveBeenCalledTimes(2)
  })

  test('should fail login when user does not exist', async () => {
    mockUserRepository.getUserByUsername.mockResolvedValue(null)

    const result = await service.login('nonexistent', 'password123', 101)

    expect(result instanceof Failure).toBe(true)
    if (result instanceof Failure) {
      expect(result.error.message).toBe('Invalid username')
    }

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { username: 'nonexistent', companyId: 101 },
      'Login failed: Invalid credentials'
    )
    expect(mockArgon2.verify).not.toHaveBeenCalled()
  })

  test('should fail login when password is incorrect', async () => {
    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockArgon2.verify.mockResolvedValue(false)

    const result = await service.login('testuser', 'wrongpassword', 101)

    expect(result instanceof Failure).toBe(true)
    if (result instanceof Failure) {
      expect(result.error.message).toBe('Invalid password')
    }

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { username: 'testuser', companyId: 101 },
      'Login failed: Invalid credentials'
    )
    expect(mockArgon2.verify).toHaveBeenCalledWith(USER.password, 'wrongpassword')
    expect(mockUserRepository.getUserCompanyAccess).not.toHaveBeenCalled()
  })

  test('should fail login when user does not have access to company', async () => {
    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockArgon2.verify.mockResolvedValue(true)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(null)

    const result = await service.login('testuser', 'password123', 999)

    expect(result instanceof Failure).toBe(true)
    if (result instanceof Failure) {
      expect(result.error.message).toBe('User does not have access to this company')
    }

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { username: 'testuser', companyId: 999 },
      'Login failed: User lacks company access'
    )
    expect(mockUserRepository.revokeAllActiveUserTokens).not.toHaveBeenCalled()
  })

  test('should revoke all active tokens before creating new ones', async () => {
    const callOrder: string[] = []

    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
    mockUserRepository.revokeAllActiveUserTokens.mockImplementation(async () => {
      callOrder.push('revoke')
    })
    mockUserRepository.createRefreshToken.mockImplementation(async () => {
      callOrder.push('create')
      return USER_REFRESH_TOKEN
    })

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    await service.login('testuser', 'password123', 101)

    expect(mockUserRepository.revokeAllActiveUserTokens).toHaveBeenCalledWith(USER.id)
    expect(mockUserRepository.createRefreshToken).toHaveBeenCalled()
    expect(callOrder).toEqual(['revoke', 'create'])
  })

  test('should generate JWT tokens with correct payload', async () => {
    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
    mockUserRepository.revokeAllActiveUserTokens.mockResolvedValue(undefined)
    mockUserRepository.createRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    await service.login('testuser', 'password123', 101)

    expect(mockJwt.sign).toHaveBeenNthCalledWith(
      1,
      {
        username: USER.username,
        companyId: 101,
        role: USER_COMPANY_ACCESS.role,
        userId: USER.id,
      },
      'test_access_secret',
      { expiresIn: '15m' }
    )

    expect(mockJwt.sign).toHaveBeenNthCalledWith(
      2,
      {
        username: USER.username,
        companyId: 101,
        role: USER_COMPANY_ACCESS.role,
        userId: USER.id,
      },
      'test_refresh_secret',
      { expiresIn: '30d' }
    )
  })

  test('should use role from company access, not user table', async () => {
    const userWithDifferentRole: User = { ...USER, role: Role.ADMIN }
    const companyAccessWithManagerRole: UserCompanyAccess = {
      userId: 1,
      companyId: 101,
      role: Role.MANAGER,
    }

    mockUserRepository.getUserByUsername.mockResolvedValue(userWithDifferentRole)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(companyAccessWithManagerRole)
    mockUserRepository.revokeAllActiveUserTokens.mockResolvedValue(undefined)
    mockUserRepository.createRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    const result = await service.login('testuser', 'password123', 101)

    expect(result instanceof Success).toBe(true)
    if (result instanceof Success) {
      expect(result.value.role).toBe(Role.MANAGER)
    }
  })

  test('should return shouldChangePassword flag from user', async () => {
    const userNeedingPasswordChange: User = { ...USER, shouldChangePassword: true }

    mockUserRepository.getUserByUsername.mockResolvedValue(userNeedingPasswordChange)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
    mockUserRepository.revokeAllActiveUserTokens.mockResolvedValue(undefined)
    mockUserRepository.createRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    const result = await service.login('testuser', 'password123', 101)

    expect(result instanceof Success).toBe(true)
    if (result instanceof Success) {
      expect(result.value.shouldChangePassword).toBe(true)
    }
  })

  test('should handle database errors gracefully', async () => {
    mockUserRepository.getUserByUsername.mockRejectedValue(new Error('Database connection failed'))

    const result = await service.login('testuser', 'password123', 101)

    expect(result instanceof Failure).toBe(true)
    if (result instanceof Failure) {
      expect(result.error.message).toBe('Database error during login process')
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        companyId: 101,
      }),
      'Error during user login process'
    )
  })

  test('should handle errors during token creation', async () => {
    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
    mockUserRepository.revokeAllActiveUserTokens.mockResolvedValue(undefined)
    mockUserRepository.createRefreshToken.mockRejectedValue(new Error('Token creation failed'))

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    const result = await service.login('testuser', 'password123', 101)

    expect(result instanceof Failure).toBe(true)
    if (result instanceof Failure) {
      expect(result.error.message).toBe('Database error during login process')
    }
  })

  test('should create refresh token with correct expiry date', async () => {
    const mockExpiryDate = new Date(Date.now() + 1000 * 60 * 60 * 24)
    mockDateFns.addDays.mockReturnValue(mockExpiryDate)

    mockUserRepository.getUserByUsername.mockResolvedValue(USER)
    mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
    mockUserRepository.revokeAllActiveUserTokens.mockResolvedValue(undefined)
    mockUserRepository.createRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)

    mockArgon2.verify.mockResolvedValue(true)
    mockJwt.sign.mockReturnValueOnce('mock_access_token').mockReturnValueOnce('mock_refresh_token')

    await service.login('testuser', 'password123', 101)

    expect(mockDateFns.addDays).toHaveBeenCalledWith(expect.any(Date), 1)
    expect(mockUserRepository.createRefreshToken).toHaveBeenCalledWith(USER.id, 'mock_refresh_token', mockExpiryDate)
  })

  describe('register', () => {
    test('should successfully register a new user', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(null)
      mockArgon2.hash.mockResolvedValue('hashedPassword123')
      mockUserRepository.createUser.mockResolvedValue(USER)

      const result = await service.register('test@example.com', 'password123', 'testuser', false, Role.ADMIN, 101)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(USER)
      }

      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith('testuser')
      expect(mockArgon2.hash).toHaveBeenCalledWith('password123')
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        'test@example.com',
        'hashedPassword123',
        'testuser',
        false,
        Role.ADMIN,
        101
      )
    })

    test('should fail when username already exists', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)

      const result = await service.register('test@example.com', 'password123', 'testuser', false, Role.ADMIN, 101)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toBe('User with username already exists')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { username: 'testuser', companyId: 101 },
        'Registration failed: username already exists'
      )
      expect(mockArgon2.hash).not.toHaveBeenCalled()
      expect(mockUserRepository.createUser).not.toHaveBeenCalled()
    })

    test('should handle database errors during registration', async () => {
      mockUserRepository.getUserByUsername.mockRejectedValue(new Error('Database connection failed'))

      const result = await service.register('test@example.com', 'password123', 'testuser', false, Role.ADMIN, 101)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
        expect(result.error.message).toBe('Database error during creation of user')
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'testuser', companyId: 101 }),
        'Error creating user during registration'
      )
    })
  })

  describe('getUserByUsername', () => {
    test('should successfully get user by username', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)

      const result = await service.getUserByUsername('testuser')

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(USER)
      }

      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith('testuser')
    })

    test('should return error when user not found', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(null)

      const result = await service.getUserByUsername('nonexistent')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError)
        expect(result.error.message).toBe('User with username: nonexistent was not found')
      }

      expect(mockLogger.debug).toHaveBeenCalledWith({ username: 'nonexistent' }, 'User not found by username')
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUserByUsername.mockRejectedValue(new Error('Database error'))

      const result = await service.getUserByUsername('testuser')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    test('should successfully get user by id', async () => {
      mockUserRepository.getUserById.mockResolvedValue(USER)

      const result = await service.getUserById(1)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(USER)
      }

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(1)
    })

    test('should return error when user not found by id', async () => {
      mockUserRepository.getUserById.mockResolvedValue(null)

      const result = await service.getUserById(999)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError)
        expect(result.error.message).toBe('User with id: 999 was not found')
      }

      expect(mockLogger.debug).toHaveBeenCalledWith({ id: 999 }, 'User not found by ID')
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUserById.mockRejectedValue(new Error('Database error'))

      const result = await service.getUserById(1)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }
    })
  })

  describe('updateUser', () => {
    test('should successfully update user', async () => {
      const updatedUser = { ...USER, email: 'newemail@example.com' }
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.updateUser.mockResolvedValue(updatedUser)

      const result = await service.updateUser(1, 101, { email: 'newemail@example.com' })

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(updatedUser)
      }

      expect(mockUserRepository.getUserCompanyAccess).toHaveBeenCalledWith(1, 101)
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, {
        email: 'newemail@example.com',
        password: undefined,
      })
    })

    test('should hash password when updating', async () => {
      const updatedUser = { ...USER }
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockArgon2.hash.mockResolvedValue('newHashedPassword')
      mockUserRepository.updateUser.mockResolvedValue(updatedUser)

      await service.updateUser(1, 101, { password: 'newPassword123' })

      expect(mockArgon2.hash).toHaveBeenCalledWith('newPassword123')
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, { password: 'newHashedPassword' })
    })

    test('should update company role when role is provided', async () => {
      const updatedUser = { ...USER, role: Role.MANAGER }
      const updatedUserCompanyAccess = { ...USER_COMPANY_ACCESS, role: Role.MANAGER }
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.updateUser.mockResolvedValue(updatedUser)
      mockUserRepository.updateCompanyRole.mockResolvedValue(updatedUserCompanyAccess)

      await service.updateUser(1, 101, { role: Role.MANAGER })

      expect(mockUserRepository.updateCompanyRole).toHaveBeenCalledWith(1, 101, Role.MANAGER)
    })

    test('should fail when user does not have company access', async () => {
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(null)

      const result = await service.updateUser(1, 999, { email: 'newemail@example.com' })

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError)
        expect(result.error.message).toBe('User does not belong to this company')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { id: 1, companyId: 999 },
        'Update user failed: User lacks company access'
      )
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled()
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUserCompanyAccess.mockRejectedValue(new Error('Database error'))

      const result = await service.updateUser(1, 101, { email: 'newemail@example.com' })

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }
    })
  })

  describe('deleteUser', () => {
    test('should delete user company access and soft delete when no remaining accesses', async () => {
      mockUserRepository.deleteUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.getCompaniesForUserId.mockResolvedValue([])
      mockUserRepository.softDeleteUser.mockResolvedValue(USER)

      const result = await service.deleteUser(1, 101)

      expect(result instanceof Success).toBe(true)

      expect(mockUserRepository.deleteUserCompanyAccess).toHaveBeenCalledWith(1, 101)
      expect(mockUserRepository.getCompaniesForUserId).toHaveBeenCalledWith(1)
      expect(mockUserRepository.softDeleteUser).toHaveBeenCalledWith(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId: 1 },
        'User soft-deleted as last company access was removed'
      )
    })

    test('should only delete company access when user has remaining accesses', async () => {
      mockUserRepository.deleteUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.getCompaniesForUserId.mockResolvedValue([COMPANY])
      mockUserRepository.softDeleteUser.mockResolvedValue(USER)

      const result = await service.deleteUser(1, 101)

      expect(result instanceof Success).toBe(true)

      expect(mockUserRepository.deleteUserCompanyAccess).toHaveBeenCalledWith(1, 101)
      expect(mockUserRepository.getCompaniesForUserId).toHaveBeenCalledWith(1)
      expect(mockUserRepository.softDeleteUser).not.toHaveBeenCalled()
    })

    test('should handle database errors', async () => {
      mockUserRepository.deleteUserCompanyAccess.mockRejectedValue(new Error('Database error'))

      const result = await service.deleteUser(1, 101)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('revokeRefreshToken', () => {
    test('should successfully revoke refresh token', async () => {
      const revokedToken = { ...USER_REFRESH_TOKEN, revoked: true }
      mockUserRepository.revokeRefreshToken.mockResolvedValue(revokedToken)

      const result = await service.revokeRefreshToken('mock-refresh-token')

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(revokedToken)
      }

      expect(mockUserRepository.revokeRefreshToken).toHaveBeenCalledWith('mock-refresh-token')
    })

    test('should handle database errors', async () => {
      mockUserRepository.revokeRefreshToken.mockRejectedValue(new Error('Database error'))

      const result = await service.revokeRefreshToken('mock-refresh-token')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
        expect(result.error.message).toBe('Failed to revoke refresh token')
      }
    })
  })

  describe('refreshAccessToken', () => {
    const validToken = 'valid-refresh-token'
    const decodedPayload = {
      username: 'testuser',
      companyId: 101,
      role: Role.ADMIN,
      userId: 1,
    }

    test('should successfully refresh access token', async () => {
      mockJwt.verify.mockReturnValue(decodedPayload)
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.getRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)
      mockJwt.sign.mockReturnValue('new-access-token')

      const result = await service.refreshAccessToken(validToken)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual({
          accessToken: 'new-access-token',
          refreshToken: validToken,
          userId: 1,
        })
      }

      expect(mockJwt.verify).toHaveBeenCalledWith(validToken, 'test_refresh_secret')
      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith('testuser')
      expect(mockUserRepository.getRefreshToken).toHaveBeenCalledWith(validToken)
    })

    test('should issue new refresh token when expiry is near', async () => {
      const nearExpiryToken = {
        ...USER_REFRESH_TOKEN,
        expiryDate: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes from now
      }
      const newRefreshToken = 'new-refresh-token'

      mockJwt.verify.mockReturnValue(decodedPayload)
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.getRefreshToken.mockResolvedValue(nearExpiryToken)
      mockUserRepository.revokeRefreshToken.mockResolvedValue({ ...nearExpiryToken, revoked: true })
      mockUserRepository.createRefreshToken.mockResolvedValue(USER_REFRESH_TOKEN)
      mockJwt.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce(newRefreshToken)

      const result = await service.refreshAccessToken(validToken)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value.refreshToken).toBe(newRefreshToken)
      }

      expect(mockUserRepository.revokeRefreshToken).toHaveBeenCalledWith(validToken)
      expect(mockUserRepository.createRefreshToken).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId: 1 },
        'Token re-issuance triggered due to short expiry time'
      )
    })

    test('should fail when user not found', async () => {
      mockJwt.verify.mockReturnValue(decodedPayload)
      mockUserRepository.getUserByUsername.mockResolvedValue(null)

      const result = await service.refreshAccessToken(validToken)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('User not found')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { token: validToken, username: 'testuser' },
        'Token refresh failed: User not found in DB'
      )
    })

    test('should fail when user lacks company access', async () => {
      mockJwt.verify.mockReturnValue(decodedPayload)
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(null)

      const result = await service.refreshAccessToken(validToken)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('Invalid refresh token')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: 1, companyId: 101 },
        'Token refresh failed: User lacks company access'
      )
    })

    test('should fail when token is revoked', async () => {
      const revokedToken = { ...USER_REFRESH_TOKEN, revoked: true }

      mockJwt.verify.mockReturnValue(decodedPayload)
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.getRefreshToken.mockResolvedValue(revokedToken)

      const result = await service.refreshAccessToken(validToken)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('Invalid or expired refresh token')
      }
    })

    test('should fail when token is expired', async () => {
      const expiredToken = {
        ...USER_REFRESH_TOKEN,
        expiryDate: new Date(Date.now() - 1000), // expired
      }

      mockJwt.verify.mockReturnValue(decodedPayload)
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)
      mockUserRepository.getRefreshToken.mockResolvedValue(expiredToken)

      const result = await service.refreshAccessToken(validToken)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('Invalid or expired refresh token')
      }
    })

    test('should fail when JWT verification fails', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = await service.refreshAccessToken('invalid-token')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('Invalid refresh token')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Token refresh failed due to JWT verification or other uncaught error'
      )
    })
  })

  describe('getAllManagersByCompanyId', () => {
    test('should successfully get all managers', async () => {
      const managers = [USER, { ...USER, id: 2, username: 'manager2' }]
      mockUserRepository.getUsersByCompanyAndRole.mockResolvedValue(managers)

      const result = await service.getAllManagersByCompanyId(101)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(managers)
      }

      expect(mockUserRepository.getUsersByCompanyAndRole).toHaveBeenCalledWith(101, Role.MANAGER)
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUsersByCompanyAndRole.mockRejectedValue(new Error('Database error'))

      const result = await service.getAllManagersByCompanyId(101)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('getAllUsersByCompanyId', () => {
    test('should successfully get all users for company', async () => {
      const users = [USER, { ...USER, id: 2, username: 'user2' }]
      mockUserRepository.getUsersForCompany.mockResolvedValue(users)

      const result = await service.getAllUsersByCompanyId(101)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(users)
      }

      expect(mockUserRepository.getUsersForCompany).toHaveBeenCalledWith(101)
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUsersForCompany.mockRejectedValue(new Error('Database error'))

      const result = await service.getAllUsersByCompanyId(101)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }
    })
  })

  describe('userHasAccess', () => {
    test('should return true when user has correct access', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(USER_COMPANY_ACCESS)

      const result = await service.userHasAccess('testuser', 101, [Role.ADMIN, Role.MANAGER])

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toBe(true)
      }
    })

    test('should fail when user does not exist', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(null)

      const result = await service.userHasAccess('nonexistent', 101, [Role.ADMIN])

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('User does not exist')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { username: 'nonexistent', companyId: 101 },
        'Access check failed: User does not exist'
      )
    })

    test('should fail when user does not have company access', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue(null)

      const result = await service.userHasAccess('testuser', 999, [Role.ADMIN])

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('User does not have access to this company')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: 1, companyId: 999 },
        'Access check failed: User lacks company access'
      )
    })

    test('should fail when user has incorrect role', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getUserCompanyAccess.mockResolvedValue({ ...USER_COMPANY_ACCESS, role: Role.COMPANY })

      const result = await service.userHasAccess('testuser', 101, [Role.ADMIN, Role.MANAGER])

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error.message).toBe('User does not have the correct role for this company')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: 1, companyId: 101, userRole: Role.COMPANY, allowedRoles: [Role.ADMIN, Role.MANAGER] },
        'Access check failed: Incorrect role'
      )
    })
  })

  describe('getUserCompanyAccesses', () => {
    test('should successfully get user company accesses', async () => {
      const companies = [COMPANY, { ...COMPANY, id: 102, name: 'Company 2' }]
      mockUserRepository.getCompaniesForUserId.mockResolvedValue(companies)

      const result = await service.getUserCompanyAccesses(1)

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(companies)
      }

      expect(mockUserRepository.getCompaniesForUserId).toHaveBeenCalledWith(1)
    })

    test('should handle database errors', async () => {
      mockUserRepository.getCompaniesForUserId.mockRejectedValue(new Error('Database error'))

      const result = await service.getUserCompanyAccesses(1)

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }
    })
  })

  describe('getCompaniesForUsername', () => {
    test('should successfully get companies for username', async () => {
      const companies = [COMPANY]
      mockUserRepository.getUserByUsername.mockResolvedValue(USER)
      mockUserRepository.getCompaniesForUserId.mockResolvedValue(companies)

      const result = await service.getCompaniesForUsername('testuser')

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(companies)
      }

      expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith('testuser')
      expect(mockUserRepository.getCompaniesForUserId).toHaveBeenCalledWith(1)
    })

    test('should return empty array when user not found', async () => {
      mockUserRepository.getUserByUsername.mockResolvedValue(null)

      const result = await service.getCompaniesForUsername('nonexistent')

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual([])
      }

      expect(mockLogger.debug).toHaveBeenCalledWith(
        { username: 'nonexistent' },
        'Companies search: User not found, returning empty list'
      )
      expect(mockUserRepository.getCompaniesForUserId).not.toHaveBeenCalled()
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUserByUsername.mockRejectedValue(new Error('Database error'))

      const result = await service.getCompaniesForUsername('testuser')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }
    })
  })
  describe('changePassword', () => {
    test('should successfully change password', async () => {
      const updatedUser = { ...USER, shouldChangePassword: false }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser
      mockUserRepository.getUserById.mockResolvedValue(USER)
      mockArgon2.hash.mockResolvedValue('newHashedPassword')
      mockUserRepository.updateUser.mockResolvedValue(updatedUser)

      const result = await service.changePassword(1, 'newPassword123')

      expect(result instanceof Success).toBe(true)
      if (result instanceof Success) {
        expect(result.value).toEqual(userWithoutPassword)
        expect(result.value).not.toHaveProperty('password')
      }

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(1)
      expect(mockArgon2.hash).toHaveBeenCalledWith('newPassword123')
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, {
        password: 'newHashedPassword',
        shouldChangePassword: false,
      })
    })

    test('should fail when user not found', async () => {
      mockUserRepository.getUserById.mockResolvedValue(null)

      const result = await service.changePassword(999, 'newPassword123')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toBe('User not found.')
      }

      expect(mockLogger.warn).toHaveBeenCalledWith({ userId: 999 }, 'Password change failed: User not found')
      expect(mockArgon2.hash).not.toHaveBeenCalled()
    })

    test('should handle database errors', async () => {
      mockUserRepository.getUserById.mockRejectedValue(new Error('Database error'))

      const result = await service.changePassword(1, 'newPassword123')

      expect(result instanceof Failure).toBe(true)
      if (result instanceof Failure) {
        expect(result.error).toBeInstanceOf(DatabaseError)
        expect(result.error.message).toBe('Database error while changing password.')
      }

      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }), 'Error changing password')
    })
  })
})
