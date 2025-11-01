import { DatabaseError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository.js'
import { Company } from '../types/index.js'

export class CompanyService implements ICompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async getAllCompaniesByUser(userId: number): Promise<Result<Company[], Error>> {
    try {
      const companies = await this.companyRepository.getAllCompaniesByUser(userId)
      return success(companies)
    } catch (error) {
      console.error('Database error during fetching of user companies:', error)
      return failure(new DatabaseError('Error during fetching of user companies'))
    }
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Result<Company, Error>> {
    try {
      const updatedCompany = await this.companyRepository.updateCompany(id, data)
      return success(updatedCompany)
    } catch (error) {
      console.error('Database error during update of company:', error)
      return failure(new DatabaseError('Error during update of company'))
    }
  }

  async createCompanyWithAdmin(userId: number, name: string, address: string): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.createCompanyWithAdmin(userId, name, address)
      return success(company)
    } catch (error) {
      console.error('Database error during creation of company with admin:', error)
      return failure(new DatabaseError('Error during creation of company with admin'))
    }
  }

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
