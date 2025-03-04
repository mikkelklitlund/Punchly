import { PrismaClient, Department } from '@prisma/client'
import { Department as DepartmentDTO } from 'shared'
import { IDepartmentRepository } from '../interfaces/repositories/IDepartmentRepository.js'

export class DepartmentRepository implements IDepartmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createDepartment(name: string, companyId: number): Promise<DepartmentDTO> {
    const department = await this.prisma.department.create({
      data: { name, companyId },
    })

    return this.translateToDTO(department)
  }

  async getDepartmentById(id: number): Promise<DepartmentDTO | null> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    })

    return department ? this.translateToDTO(department) : null
  }

  async getAllDepartments(): Promise<DepartmentDTO[]> {
    const departments = await this.prisma.department.findMany()
    return departments.map(this.translateToDTO)
  }

  async getAllDepartmentsByCompanyId(companyId: number): Promise<DepartmentDTO[]> {
    const departments = await this.prisma.department.findMany({
      where: { companyId },
    })

    return departments.map(this.translateToDTO)
  }

  async updateDepartment(id: number, data: Partial<Omit<Department, 'id'>>): Promise<DepartmentDTO> {
    const department = await this.prisma.department.update({
      where: { id },
      data,
    })

    return this.translateToDTO(department)
  }

  async deleteDepartment(id: number): Promise<DepartmentDTO> {
    const department = await this.prisma.department.delete({
      where: { id },
    })

    return this.translateToDTO(department)
  }

  async deleteDepartmentByCompanyIdAndName(companyId: number, name: string): Promise<DepartmentDTO> {
    const department = await this.prisma.department.delete({
      where: {
        departmentCompany: { companyId, name },
      },
    })

    return this.translateToDTO(department)
  }

  private translateToDTO(department: Department): DepartmentDTO {
    return {
      id: department.id,
      name: department.name,
      companyId: department.companyId,
    }
  }
}
