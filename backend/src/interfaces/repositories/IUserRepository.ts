import { User } from 'shared'

export interface IUserRepository {
  createUser(email: string, password: string, username: string): Promise<User>
  getUserById(id: number): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  getUserByUsername(username: string): Promise<User | null>
  getAllActiveUsers(): Promise<User[]>
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User>
  softDeleteUser(id: number): Promise<User>
}
