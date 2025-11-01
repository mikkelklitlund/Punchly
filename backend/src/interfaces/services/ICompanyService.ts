import { Company } from '../../types/index.js'
import { Result } from '../../utils/Result.js'

export interface ICompanyService {
  createCompany(name: string, address: string): Promise<Result<Company, Error>>
  getAllCompanies(): Promise<Result<Company[], Error>>
  getAllCompaniesByUser(userId: number): Promise<Result<Company[], Error>>
  deleteCompany(id: number): Promise<Result<Company, Error>>
  updateCompany(id: number, data: Partial<Company>): Promise<Result<Company, Error>>
  createCompanyWithAdmin(userId: number, name: string, address: string): Promise<Result<Company, Error>>
}
