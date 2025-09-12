import { Company } from '../../types/index.js'

export interface ICompanyRepository {
  createCompany(name: string, address: string): Promise<Company>
  getCompanyById(id: number): Promise<Company | null>
  getCompanyByName(name: string): Promise<Company | null>
  getAllCompanies(): Promise<Company[]>
  updateCompany(id: number, data: Partial<Omit<Company, 'id'>>): Promise<Company>
  deleteCompany(id: number): Promise<Company>
}
