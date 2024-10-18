import { Company } from 'shared'
import CompanyRepository from 'src/repositories/CompanyRepository'
import { DatabaseError } from 'src/utils/Errors'
import { failure, Result, success } from 'src/utils/Result'

class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async createCompany(name: string, address: string): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.createCompany({ name, address })
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

export default CompanyService
