import { Company } from '../../types/index.js'
import { Result } from '../../utils/Result.js'

export interface ICompanyService {
  createCompany(name: string, address: string): Promise<Result<Company, Error>>
  getAllCompanies(): Promise<Result<Company[], Error>>
  deleteCompany(id: number): Promise<Result<Company, Error>>
}
