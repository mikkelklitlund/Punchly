import { Department } from 'shared'
import { Result } from 'src/utils/Result'

export interface IDepartmentService {
  createDepartment(companyId: number, name: string): Promise<Result<Department, Error>>
  getDepartmentsByCompanyId(companyId: number): Promise<Result<Department[], Error>>
  deleteDepartmentByNameAndCompanyId(companyId: number, name: string): Promise<Result<Department, Error>>
}
