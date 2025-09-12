import { PrismaClient, EmployeeType as PrismaEmployeeType } from '@prisma/client'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository.js'
import { EmployeeType } from '../types/index.js'

export class EmployeeTypeRepository implements IEmployeeTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaType: PrismaEmployeeType): EmployeeType {
    return {
      id: prismaType.id,
      name: prismaType.name,
      companyId: prismaType.companyId,
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<EmployeeType, 'id'>>): Partial<Omit<EmployeeType, 'id'>> {
    const data: Partial<Omit<EmployeeType, 'id'>> = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.companyId !== undefined) data.companyId = patch.companyId
    return data
  }

  async createEmployeeType(name: string, companyId: number): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.create({
      data: { name, companyId },
    })
    return this.toDomain(type)
  }

  async getEmployeeTypeById(id: number): Promise<EmployeeType | null> {
    const type = await this.prisma.employeeType.findUnique({
      where: { id },
    })
    return type ? this.toDomain(type) : null
  }

  async getEmployeeTypeByCompanyId(companyId: number): Promise<EmployeeType[]> {
    const types = await this.prisma.employeeType.findMany({
      where: { companyId },
    })
    return types.map((t) => this.toDomain(t))
  }

  async employeeTypeExistsOnCompanyId(companyId: number, name: string): Promise<boolean> {
    const found = await this.prisma.employeeType.findUnique({
      where: {
        typeCompany: { companyId, name },
      },
    })
    return found !== null
  }

  async updateEmployeeType(id: number, patch: Partial<Omit<EmployeeType, 'id'>>): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(type)
  }

  async deleteEmployeeType(id: number): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.delete({
      where: { id },
    })
    return this.toDomain(type)
  }

  async deleteEmployeeTypeByCompanyIdAndName(companyId: number, name: string): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.delete({
      where: {
        typeCompany: { companyId, name },
      },
    })
    return this.toDomain(type)
  }
}
