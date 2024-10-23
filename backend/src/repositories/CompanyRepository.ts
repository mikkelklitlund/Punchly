import { PrismaClient, Company } from '@prisma/client'
import { Company as CompanyDTO } from 'shared'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository'

export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async createCompany(name: string, address: string): Promise<CompanyDTO> {
    const company = await this.prisma.company.create({
      data: { name, address },
    })

    return this.translateToDTO(company)
  }

  async getCompanyById(id: number): Promise<CompanyDTO | null> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    })

    return company ? this.translateToDTO(company) : null
  }

  async getCompanyByName(name: string): Promise<CompanyDTO | null> {
    const company = await this.prisma.company.findFirst({
      where: { name },
    })

    return company ? this.translateToDTO(company) : null
  }

  async getAllCompanies(): Promise<CompanyDTO[]> {
    const companies = await this.prisma.company.findMany()
    return companies.map(this.translateToDTO)
  }

  async updateCompany(id: number, data: Partial<Omit<Company, 'id'>>): Promise<CompanyDTO> {
    const company = await this.prisma.company.update({
      where: { id },
      data,
    })

    return this.translateToDTO(company)
  }

  async deleteCompany(id: number): Promise<Company> {
    const company = await this.prisma.company.delete({
      where: { id },
    })

    return this.translateToDTO(company)
  }

  private translateToDTO(company: Company): CompanyDTO {
    return {
      id: company.id,
      address: company.address,
      name: company.name,
    }
  }
}
