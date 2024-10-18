import { Company } from 'shared'
import { Result } from 'src/utils/Result'

export interface ICompanyService {
  createCompany(name: string, address: string): Promise<Result<Company, Error>>
  getAllCompanies(): Promise<Result<Company[], Error>>
  deleteCompany(id: number): Promise<Result<Company, Error>>
}
