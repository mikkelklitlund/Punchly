import { Department } from 'shared'

export interface IDepartmentRepository {
  createDepartment(name: string, companyId: number): Promise<Department>
  getDepartmentById(id: number): Promise<Department | null>
  getAllDepartments(): Promise<Department[]>
  getAllDepartmentsByCompanyId(companyId: number): Promise<Department[]>
  updateDepartment(id: number, data: Partial<Omit<Department, 'id'>>): Promise<Department>
  deleteDepartment(id: number): Promise<Department>
  deleteDepartmentByCompanyIdAndName(companyId: number, name: string): Promise<Department>
}
