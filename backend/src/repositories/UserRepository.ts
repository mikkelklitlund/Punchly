import { PrismaClient, User } from '@prisma/client'
import { User as UserDTO, UserRefreshToken } from 'shared'
import { IUserRepository } from 'src/interfaces/repositories/IUserRepository'

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(email: string, password: string, username: string): Promise<UserDTO> {
    const user = await this.prisma.user.create({
      data: { email, password, username },
    })

    return this.translateToDTO(user)
  }

  async getUserById(id: number): Promise<UserDTO | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    return user ? this.translateToDTO(user) : null
  }

  async getUserByEmail(email: string): Promise<UserDTO | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    return user ? this.translateToDTO(user) : null
  }

  async getUserByUsername(username: string): Promise<UserDTO | null> {
    const user = await this.prisma.user.findFirst({
      where: { username },
    })

    return user ? this.translateToDTO(user) : null
  }

  async getAllActiveUsers(): Promise<UserDTO[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    })

    return users.map(this.translateToDTO)
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<UserDTO> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    })

    return this.translateToDTO(user)
  }

  async softDeleteUser(id: number): Promise<UserDTO> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return this.translateToDTO(user)
  }

  async getRefreshToken(refreshToken: string): Promise<UserRefreshToken | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken, revoked: false },
    })

    return token
      ? {
          id: token.id,
          userId: token.userId,
          token: token.token,
          revoked: token.revoked,
          createdAt: token.createdAt,
          expiryDate: token.expiryDate,
        }
      : null
  }

  async createRefreshToken(userId: number, refreshToken: string, expiryDate: Date): Promise<UserRefreshToken> {
    const token = await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiryDate,
      },
    })

    return {
      id: token.id,
      userId: token.userId,
      token: token.token,
      revoked: token.revoked,
      createdAt: token.createdAt,
      expiryDate: token.expiryDate,
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<UserRefreshToken> {
    const token = await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        revoked: true,
      },
    })

    return {
      id: token.id,
      userId: token.userId,
      token: token.token,
      revoked: token.revoked,
      createdAt: token.createdAt,
      expiryDate: token.expiryDate,
    }
  }

  private translateToDTO(user: User): UserDTO {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
    }
  }
}
