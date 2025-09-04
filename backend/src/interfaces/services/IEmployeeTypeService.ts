import { EmployeeType } from '../../types/index.js'
import { Result } from '../../utils/Result.js'

export interface IEmployeeTypeService {
  createEmployeeType(typeName: string, companyId: number): Promise<Result<EmployeeType, Error>>
  getEmployeeTypesByCompanyId(companyId: number): Promise<Result<EmployeeType[], Error>>
  deleteEmployeeTypeFromCompany(companyId: number, typeName: string): Promise<Result<EmployeeType, Error>>
  deleteEmployeeType(employeeTypeId: number): Promise<Result<EmployeeType, Error>>
  renameEmployeeType(employeeTypeId: number, newName: string): Promise<Result<EmployeeType, Error>>
}
