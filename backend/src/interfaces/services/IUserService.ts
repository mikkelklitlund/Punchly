import { User } from 'shared'
import { Result } from 'src/utils/Result'

export interface IUserService {
  register(email: string, password: string, username: string): Promise<Result<User, Error>>
  login(username: string, password: string): Promise<Result<string, Error>>
  getUserById(id: number): Promise<Result<User, Error>>
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<Result<User, Error>>
  deleteUser(id: number): Promise<Result<User, Error>>
}
