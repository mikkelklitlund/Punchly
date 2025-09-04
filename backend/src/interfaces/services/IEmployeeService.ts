import { CreateEmployee, Employee, SimpleEmployee } from '../../types/index.js'
import { Result } from '../../utils/Result.js'

export interface IEmployeeService {
  createEmployee(data: CreateEmployee): Promise<Result<Employee, Error>>
  getEmployeeById(id: number): Promise<Result<Employee, Error>>
  getAllEmployees(): Promise<Result<Employee[], Error>>
  updateEmployee(id: number, data: Partial<Omit<Employee, 'id'>>): Promise<Result<Employee, Error>>
  deleteEmployee(id: number): Promise<Result<Employee, Error>>
  getAllEmployeesByCompanyId(companyId: number): Promise<Result<Employee[], Error>>
  getAllEmployeesByDepartmentIdAndCompanyId(departmentId: number, companyId: number): Promise<Result<Employee[], Error>>
  updateProfilePicture(id: number, filePath: string): Promise<Result<Employee, Error>>
  getSimpleEmployeesByDepartment(companyId: number, departmentId: number): Promise<Result<SimpleEmployee[], Error>>
  getSimpleEmployees(companyId: number): Promise<Result<SimpleEmployee[], Error>>
}
