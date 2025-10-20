import { ManagerInvite } from '../../types/index.js'

export interface IManagerInviteRepository {
  createInvite(email: string, companyId: number, token: string, expiryDate: Date): Promise<ManagerInvite>
  getInviteByToken(token: string): Promise<ManagerInvite | null>
  markInviteUsed(token: string): Promise<ManagerInvite | null>
  deleteInvite(id: number): Promise<ManagerInvite | null>
}
