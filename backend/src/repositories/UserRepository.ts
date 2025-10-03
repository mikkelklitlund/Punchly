import {
  PrismaClient,
  User as PrismaUser,
  RefreshToken as PrismaRefreshToken,
  UserCompanyAccess as PrismaUserCompanyAccess,
  Company as PrismaCompany,
  Role as PrismaRole,
} from '@prisma/client'

import { IUserRepository } from '../interfaces/repositories/IUserRepository.js'
import { User, UserRefreshToken, UserCompanyAccess, Company } from '../types/index.js'
import { Role } from 'shared'
import { UTCDateMini } from '@date-fns/utc'

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(user: PrismaUser): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      deletedAt: user.deletedAt ?? undefined,
      shouldChangePassword: user.shouldChangePassword,
    }
  }

  private toDomainRefreshToken(token: PrismaRefreshToken): UserRefreshToken {
    return {
      id: token.id,
      userId: token.userId,
      token: token.token,
      revoked: token.revoked,
      createdAt: token.createdAt,
      expiryDate: token.expiryDate,
    }
  }

  private toDomainCompany(company: PrismaCompany): Company {
    return {
      id: company.id,
      name: company.name,
      address: company.address,
    }
  }

  private toDomainAccess(access: PrismaUserCompanyAccess): UserCompanyAccess {
    return {
      userId: access.userId,
      companyId: access.companyId,
      role: access.role,
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<User, 'id'>>): Partial<Omit<User, 'id'>> {
    const data: Partial<Omit<User, 'id'>> = {}
    if (patch.email !== undefined) data.email = patch.email
    if (patch.password !== undefined) data.password = patch.password
    if (patch.username !== undefined) data.username = patch.username
    if (patch.deletedAt !== undefined) data.deletedAt = patch.deletedAt
    if (patch.shouldChangePassword !== undefined) data.shouldChangePassword = patch.shouldChangePassword
    return data
  }

  async createUser(email: string, password: string, username: string, shouldChangePassword: boolean): Promise<User> {
    const user = await this.prisma.user.create({
      data: { email, password, username, shouldChangePassword },
    })
    return this.toDomain(user)
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    return user ? this.toDomain(user) : null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    return user ? this.toDomain(user) : null
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({ where: { username } })
    return user ? this.toDomain(user) : null
  }

  async getAllActiveUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany({ where: { deletedAt: null } })
    return users.map((u) => this.toDomain(u))
  }

  async updateUser(id: number, patch: Partial<Omit<User, 'id'>>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(user)
  }

  async softDeleteUser(id: number): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new UTCDateMini() },
    })
    return this.toDomain(user)
  }

  async getRefreshToken(refreshToken: string): Promise<UserRefreshToken | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })
    return token ? this.toDomainRefreshToken(token) : null
  }

  async createRefreshToken(userId: number, refreshToken: string, expiryDate: Date): Promise<UserRefreshToken> {
    const token = await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiryDate },
    })
    return this.toDomainRefreshToken(token)
  }

  async revokeRefreshToken(refreshToken: string): Promise<UserRefreshToken> {
    const token = await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    })
    return this.toDomainRefreshToken(token)
  }

  async revokeAllActiveUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    })
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { OR: [{ expiryDate: { lt: new UTCDateMini() } }, { revoked: true }] },
    })
  }

  async getUserCompanyAccess(userId: number, companyId: number): Promise<UserCompanyAccess | null> {
    const access = await this.prisma.userCompanyAccess.findUnique({
      where: { userId_companyId: { userId, companyId } },
    })
    return access ? this.toDomainAccess(access) : null
  }

  async getUsersByCompanyAndRole(companyId: number, role: Role): Promise<User[]> {
    const accesses = await this.prisma.userCompanyAccess.findMany({
      where: { companyId, role: role as PrismaRole },
      include: { user: true },
    })
    return accesses.map((acc) => this.toDomain(acc.user))
  }

  async getCompaniesForUserId(userId: number): Promise<Company[]> {
    const rows = await this.prisma.userCompanyAccess.findMany({
      where: { userId },
      include: { company: true },
    })
    return rows.map((r) => this.toDomainCompany(r.company))
  }
}
