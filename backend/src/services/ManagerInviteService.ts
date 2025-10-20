import { randomUUID } from 'crypto'
import { ManagerInvite } from '../types/index.js'
import { IManagerInviteRepository } from '../interfaces/repositories/IManagerInviteRepository.js'
import { IManagerInviteService } from '../interfaces/services/IManagerInviteService.js'
import { UTCDateMini } from '@date-fns/utc'

export class ManagerInviteService implements IManagerInviteService {
  constructor(private readonly repo: IManagerInviteRepository) {}

  async createInvite(email: string, companyId: number): Promise<ManagerInvite> {
    const token = randomUUID()
    const expiryDate = new UTCDateMini(UTCDateMini.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return await this.repo.createInvite(email, companyId, token, expiryDate)
  }

  async getValidInvite(token: string): Promise<ManagerInvite | null> {
    const invite = await this.repo.getInviteByToken(token)
    if (!invite) return null
    if (invite.used) return null
    if (invite.expiryDate < new UTCDateMini()) return null
    return invite
  }

  async redeemInvite(token: string): Promise<ManagerInvite | null> {
    const invite = await this.getValidInvite(token)
    if (!invite) return null
    return await this.repo.markInviteUsed(token)
  }
}
