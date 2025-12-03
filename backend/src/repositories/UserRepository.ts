import {
  PrismaClient,
  User as PrismaUser,
  RefreshToken as PrismaRefreshToken,
  UserCompanyAccess as PrismaUserCompanyAccess,
  Company as PrismaCompany,
} from '@prisma/client'

import { IUserRepository } from '../interfaces/repositories/IUserRepository.js'
import { UTCDateMini } from '@date-fns/utc'
import { User, UserRefreshToken, UserCompanyAccess, Company } from '../types/index.js'
import { Role } from 'shared'

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(user: PrismaUser, role?: string): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email ?? undefined,
      password: user.password,
      deletedAt: user.deletedAt ?? undefined,
      shouldChangePassword: user.shouldChangePassword,
      role: role as Role,
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
    }
  }

  private toDomainAccess(access: PrismaUserCompanyAccess): UserCompanyAccess {
    return {
      userId: access.userId,
      companyId: access.companyId,
      role: access.role as Role,
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

  async createUser(
    email: string | undefined,
    password: string,
    username: string,
    shouldChangePassword: boolean,
    role: Role,
    companyId: number
  ): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password,
        shouldChangePassword,
        companies: {
          create: {
            companyId,
            role,
          },
        },
      },
    })
    return this.toDomain(user)
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
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

  async getUsersForCompany(companyId: number): Promise<User[]> {
    const users = await this.prisma.userCompanyAccess.findMany({
      where: { companyId },
      include: { user: true },
    })
    return users.map((acc) => this.toDomain(acc.user, acc.role))
  }

  async getUsersByCompanyAndRole(companyId: number, role: Role): Promise<User[]> {
    const accesses = await this.prisma.userCompanyAccess.findMany({
      where: { companyId, role },
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

  async updateCompanyRole(userId: number, companyId: number, newRole: Role): Promise<UserCompanyAccess> {
    const access = await this.prisma.userCompanyAccess.update({
      where: {
        userId_companyId: { userId, companyId },
      },
      data: {
        role: newRole,
      },
    })
    return this.toDomainAccess(access)
  }

  async deleteUserCompanyAccess(userId: number, companyId: number): Promise<UserCompanyAccess> {
    const access = await this.prisma.userCompanyAccess.delete({
      where: {
        userId_companyId: { userId, companyId },
      },
    })
    return this.toDomainAccess(access)
  }
}
