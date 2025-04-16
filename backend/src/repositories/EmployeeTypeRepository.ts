import { PrismaClient, EmployeeType } from '@prisma/client'
import { EmployeeType as EmployeeTypeDTO } from 'shared'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository.js'

export class EmployeeTypeRepository implements IEmployeeTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEmployeeType(name: string, companyId: number): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.create({
      data: { name, companyId },
    })

    return this.translateToDTO(type)
  }

  async getEmployeeTypeById(id: number): Promise<EmployeeType | null> {
    const type = await this.prisma.employeeType.findUnique({
      where: { id },
    })

    return type ? this.translateToDTO(type) : null
  }

  async getEmployeeTypeByCompanyId(companyId: number): Promise<EmployeeType[]> {
    const types = await this.prisma.employeeType.findMany({
      where: { companyId },
    })

    return types.map(this.translateToDTO)
  }

  async employeeTypeExistsOnCompanyId(companyId: number, name: string): Promise<boolean> {
    return (
      (await this.prisma.employeeType.findUnique({
        where: {
          typeCompany: { companyId, name },
        },
      })) !== null
    )
  }

  async updateEmployeeType(id: number, data: Partial<Omit<EmployeeType, 'id'>>): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.update({
      where: { id },
      data,
    })

    return this.translateToDTO(type)
  }

  async deleteEmployeeType(id: number): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.delete({
      where: { id },
    })

    return this.translateToDTO(type)
  }

  async deleteEmployeeTypeByCompanyIdAndName(companyId: number, name: string): Promise<EmployeeType> {
    const type = await this.prisma.employeeType.delete({
      where: {
        typeCompany: { companyId, name },
      },
    })

    return this.translateToDTO(type)
  }

  private translateToDTO(employeeType: EmployeeType): EmployeeTypeDTO {
    return {
      id: employeeType.id,
      name: employeeType.name,
      companyId: employeeType.companyId,
    }
  }
}
