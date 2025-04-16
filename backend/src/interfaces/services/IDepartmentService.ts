import { Department } from 'shared'
import { Result } from '../../utils/Result.js'

export interface IDepartmentService {
  createDepartment(companyId: number, name: string): Promise<Result<Department, Error>>
  getDepartmentsByCompanyId(companyId: number): Promise<Result<Department[], Error>>
  deleteDepartmentByNameAndCompanyId(companyId: number, name: string): Promise<Result<Department, Error>>
}
