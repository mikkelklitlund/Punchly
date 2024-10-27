import { Company } from 'shared'
import { DatabaseError } from '../utils/Errors'
import { failure, Result, success } from '../utils/Result'
import { ICompanyService } from '../interfaces/services/ICompanyService'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository'

export class CompanyService implements ICompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async createCompany(name: string, address: string): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.createCompany(name, address)
      return success(company)
    } catch (error) {
      console.log('Database error during creation of company: ', error)
      return failure(new DatabaseError('Error during creation of company'))
    }
  }

  async getAllCompanies(): Promise<Result<Company[], Error>> {
    try {
      const companies = await this.companyRepository.getAllCompanies()
      return success(companies)
    } catch (error) {
      console.log('Database error during fetching of companies: ', error)
      return failure(new DatabaseError('Error during fetching of companies'))
    }
  }

  async deleteCompany(id: number): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.deleteCompany(id)
      return success(company)
    } catch (error) {
      console.log('Database error during deleting company: ', error)
      return failure(new DatabaseError('Error during deletion of company'))
    }
  }
}
