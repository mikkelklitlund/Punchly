import { Role } from 'shared'
import { Company, User, UserCompanyAccess, UserRefreshToken } from '../../types/index.js'

export interface IUserRepository {
  createUser(email: string, password: string, username: string): Promise<User>
  getUserById(id: number): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  getUserByUsername(username: string): Promise<User | null>
  getAllActiveUsers(): Promise<User[]>
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User>
  softDeleteUser(id: number): Promise<User>
  getRefreshToken(refreshToken: string): Promise<UserRefreshToken | null>
  createRefreshToken(userId: number, refreshToken: string, expiryDate: Date): Promise<UserRefreshToken>
  revokeRefreshToken(refreshToken: string): Promise<UserRefreshToken>
  cleanupExpiredTokens(): Promise<void>
  revokeAllActiveUserTokens(userId: number): Promise<void>
  getUserCompanyAccess(userId: number, companyId: number): Promise<UserCompanyAccess | null>
  getUsersByCompanyAndRole(companyId: number, role: Role): Promise<User[]>
  getCompaniesForUserId(userId: number): Promise<Company[]>
}
