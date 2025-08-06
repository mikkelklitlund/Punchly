import { CreateEmployee, Employee, EmployeeWithRecords } from 'shared'

export interface IEmployeeRepository {
  createEmployee(data: CreateEmployee): Promise<Employee>
  getEmployeeById(id: number): Promise<Employee | null>
  getAllEmployees(): Promise<Employee[]>
  getActiveEmployeesByCompanyId(companyId: number): Promise<Employee[]>
  getAllEmployeesByCompanyIdAndDepartmentId(companyId: number, departmentId: number): Promise<Employee[]>
  updateEmployee(
    id: number,
    data: Partial<Omit<Employee, 'id' | 'absenceRecords' | 'attendanceRecords'>>
  ): Promise<Employee>
  softDeleteEmployee(id: number): Promise<Employee>
  getEmployeesWithAttendanceAndAbsences(
    startDate: Date,
    endDate: Date,
    companyId: number,
    departmentId?: number
  ): Promise<EmployeeWithRecords[]>
}
