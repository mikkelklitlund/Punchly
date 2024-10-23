import { CreateEmployee, Employee } from 'shared'
import { Result } from '../../utils/Result'

export interface IEmployeeService {
  createEmployee(data: CreateEmployee): Promise<Result<Employee, Error>>
  getEmployeeById(id: number): Promise<Result<Employee, Error>>
  getAllEmployees(): Promise<Result<Employee[], Error>>
  updateEmployee(id: number, data: Partial<Omit<Employee, 'id'>>): Promise<Result<Employee, Error>>
  deleteEmployee(id: number): Promise<Result<Employee, Error>>
  getAllEmployeesByCompanyId(companyId: number): Promise<Result<Employee[], Error>>
  getAllEmployeesByDepartmentIdAndCompanyId(departmentId: number, companyId: number): Promise<Result<Employee[], Error>>
  updateProfilePicture(id: number, filePath: string): Promise<Result<Employee, Error>>
}
