import { DatabaseError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository.js'
import { Company } from '../types/index.js'
import { Logger } from 'pino'

export class CompanyService implements ICompanyService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly logger: Logger
  ) {}

  async getAllCompaniesByUser(userId: number): Promise<Result<Company[], Error>> {
    try {
      const companies = await this.companyRepository.getAllCompaniesByUser(userId)
      return success(companies)
    } catch (error) {
      this.logger.error({ error, userId }, 'Database error during fetching of user companies')
      return failure(new DatabaseError('Error during fetching of user companies'))
    }
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Result<Company, Error>> {
    try {
      const updatedCompany = await this.companyRepository.updateCompany(id, data)
      return success(updatedCompany)
    } catch (error) {
      this.logger.error({ error, companyId: id, data }, 'Database error during update of company')
      return failure(new DatabaseError('Error during update of company'))
    }
  }

  async createCompanyWithAdmin(userId: number, name: string): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.createCompanyWithAdmin(userId, name)
      return success(company)
    } catch (error) {
      this.logger.error({ error, userId, name }, 'Database error during creation of company with admin')
      return failure(new DatabaseError('Error during creation of company with admin'))
    }
  }

  async createCompany(name: string): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.createCompany(name)
      return success(company)
    } catch (error) {
      this.logger.error({ error, name }, 'Database error during creation of company')
      return failure(new DatabaseError('Error during creation of company'))
    }
  }

  async getAllCompanies(): Promise<Result<Company[], Error>> {
    try {
      const companies = await this.companyRepository.getAllCompanies()
      return success(companies)
    } catch (error) {
      this.logger.error({ error }, 'Database error during fetching of companies')
      return failure(new DatabaseError('Error during fetching of companies'))
    }
  }

  async deleteCompany(id: number): Promise<Result<Company, Error>> {
    try {
      const company = await this.companyRepository.deleteCompany(id)
      return success(company)
    } catch (error) {
      this.logger.error({ error, companyId: id }, 'Database error during deleting company')
      return failure(new DatabaseError('Error during deletion of company'))
    }
  }
}
