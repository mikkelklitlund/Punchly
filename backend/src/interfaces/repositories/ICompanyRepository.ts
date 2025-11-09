import { Company } from '../../types/index.js'

export interface ICompanyRepository {
  getAllCompanies(): Promise<Company[]>
  getAllCompaniesByUser(userId: number): Promise<Company[]>
  createCompany(name: string, address: string): Promise<Company>
  createCompanyWithAdmin(userId: number, name: string, address: string): Promise<Company>
  updateCompany(id: number, data: Partial<Company>): Promise<Company>
  deleteCompany(id: number): Promise<Company>
  getCompanyById(id: number): Promise<Company | null>
}
