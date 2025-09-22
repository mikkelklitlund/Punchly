import { ManagerInvite } from '../../types/index.js'

export interface IManagerInviteService {
  createInvite(email: string, companyId: number): Promise<ManagerInvite>
  getValidInvite(token: string): Promise<ManagerInvite | null>
  redeemInvite(token: string): Promise<ManagerInvite | null>
}
