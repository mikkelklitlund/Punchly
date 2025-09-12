import { PrismaClient, Company as PrismaCompany } from '@prisma/client'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository.js'
import { Company } from '../types/index.js'

export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaCompany: PrismaCompany): Company {
    return {
      id: prismaCompany.id,
      address: prismaCompany.address,
      name: prismaCompany.name,
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<Company, 'id'>>): Partial<Omit<Company, 'id'>> {
    const data: Partial<Omit<Company, 'id'>> = {}
    if (patch.address !== undefined) data.address = patch.address
    if (patch.name !== undefined) data.name = patch.name
    return data
  }

  async createCompany(name: string, address: string): Promise<Company> {
    const company = await this.prisma.company.create({
      data: { name, address },
    })
    return this.toDomain(company)
  }

  async getCompanyById(id: number): Promise<Company | null> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    })
    return company ? this.toDomain(company) : null
  }

  async getCompanyByName(name: string): Promise<Company | null> {
    const company = await this.prisma.company.findFirst({
      where: { name },
    })
    return company ? this.toDomain(company) : null
  }

  async getAllCompanies(): Promise<Company[]> {
    const companies = await this.prisma.company.findMany()
    return companies.map((c) => this.toDomain(c))
  }

  async updateCompany(id: number, patch: Partial<Omit<Company, 'id'>>): Promise<Company> {
    const company = await this.prisma.company.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(company)
  }

  async deleteCompany(id: number): Promise<Company> {
    const company = await this.prisma.company.delete({
      where: { id },
    })
    return this.toDomain(company)
  }
}
