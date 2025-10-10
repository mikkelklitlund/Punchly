import { Role } from 'shared'
import { Company, User, UserCompanyAccess, UserRefreshToken } from '../../types/index.js'

export interface IUserRepository {
  createUser(
    email: string | undefined,
    password: string,
    username: string,
    shouldChangePassword: boolean,
    role: Role,
    companyId: number
  ): Promise<User>
  getUserById(id: number): Promise<User | null>
  getUsersForCompany(companyId: number): Promise<User[]>
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
