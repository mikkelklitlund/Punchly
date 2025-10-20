import { PrismaClient, ManagerInvite as PrismaManagerInvite } from '@prisma/client'
import { IManagerInviteRepository } from '../interfaces/repositories/IManagerInviteRepository.js'
import { ManagerInvite } from '../types/index.js'

export class ManagerInviteRepository implements IManagerInviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaInvite: PrismaManagerInvite): ManagerInvite {
    return {
      id: prismaInvite.id,
      email: prismaInvite.email,
      companyId: prismaInvite.companyId,
      token: prismaInvite.token,
      expiryDate: prismaInvite.expiryDate,
      used: prismaInvite.used,
    }
  }

  async createInvite(email: string, companyId: number, token: string, expiryDate: Date): Promise<ManagerInvite> {
    const invite = await this.prisma.managerInvite.create({
      data: { email, companyId, token, expiryDate },
    })
    return this.toDomain(invite)
  }

  async getInviteByToken(token: string): Promise<ManagerInvite | null> {
    const invite = await this.prisma.managerInvite.findUnique({
      where: { token },
    })
    return invite ? this.toDomain(invite) : null
  }

  async markInviteUsed(token: string): Promise<ManagerInvite | null> {
    const invite = await this.prisma.managerInvite.update({
      where: { token },
      data: { used: true },
    })
    return this.toDomain(invite)
  }

  async deleteInvite(id: number): Promise<ManagerInvite | null> {
    const invite = await this.prisma.managerInvite.delete({
      where: { id },
    })
    return this.toDomain(invite)
  }
}
