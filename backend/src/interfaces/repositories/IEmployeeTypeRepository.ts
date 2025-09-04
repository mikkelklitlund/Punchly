import { EmployeeType } from '../../types/index.js'

export interface IEmployeeTypeRepository {
  createEmployeeType(name: string, companyId: number): Promise<EmployeeType>
  getEmployeeTypeById(id: number): Promise<EmployeeType | null>
  getEmployeeTypeByCompanyId(companyId: number): Promise<EmployeeType[]>
  employeeTypeExistsOnCompanyId(companyId: number, name: string): Promise<boolean>
  updateEmployeeType(id: number, data: Partial<Omit<EmployeeType, 'id'>>): Promise<EmployeeType>
  deleteEmployeeType(id: number): Promise<EmployeeType>
  deleteEmployeeTypeByCompanyIdAndName(companyId: number, name: string): Promise<EmployeeType>
}
