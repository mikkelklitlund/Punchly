import { EmployeeType } from 'shared'
import { Result } from 'src/utils/Result'

export interface IEmployeeTypeService {
  createEmployeeType(typeName: string, companyId: number): Promise<Result<EmployeeType, Error>>
  getEmployeeTypesByCompanyId(companyId: number): Promise<Result<EmployeeType[], Error>>
  deleteEmployeeTypeFromCompany(companyId: number, typeName: string): Promise<Result<EmployeeType, Error>>
}
