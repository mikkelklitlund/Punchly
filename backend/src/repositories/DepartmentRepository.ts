import { PrismaClient, Department as PrismaDepartment } from '@prisma/client'
import { IDepartmentRepository } from '../interfaces/repositories/IDepartmentRepository.js'
import { Department } from '../types/index.js'

export class DepartmentRepository implements IDepartmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaDep: PrismaDepartment): Department {
    return {
      id: prismaDep.id,
      name: prismaDep.name,
      companyId: prismaDep.companyId,
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<Department, 'id'>>): Partial<Omit<Department, 'id'>> {
    const data: Partial<Omit<Department, 'id'>> = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.companyId !== undefined) data.companyId = patch.companyId
    return data
  }

  async createDepartment(name: string, companyId: number): Promise<Department> {
    const department = await this.prisma.department.create({
      data: { name, companyId },
    })
    return this.toDomain(department)
  }

  async getDepartmentById(id: number): Promise<Department | null> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    })
    return department ? this.toDomain(department) : null
  }

  async getAllDepartments(): Promise<Department[]> {
    const departments = await this.prisma.department.findMany()
    return departments.map((d) => this.toDomain(d))
  }

  async getAllDepartmentsByCompanyId(companyId: number): Promise<Department[]> {
    const departments = await this.prisma.department.findMany({
      where: { companyId },
    })
    return departments.map((d) => this.toDomain(d))
  }

  async updateDepartment(id: number, patch: Partial<Omit<Department, 'id'>>): Promise<Department> {
    const department = await this.prisma.department.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(department)
  }

  async deleteDepartment(id: number): Promise<Department> {
    const department = await this.prisma.department.delete({
      where: { id },
    })
    return this.toDomain(department)
  }

  async deleteDepartmentByCompanyIdAndName(companyId: number, name: string): Promise<Department> {
    const department = await this.prisma.department.delete({
      where: {
        departmentCompany: { companyId, name },
      },
    })
    return this.toDomain(department)
  }
}
