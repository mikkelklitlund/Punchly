import { Result, failure, success } from '../utils/Result.js'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository.js'
import { IDepartmentRepository } from '../interfaces/repositories/IDepartmentRepository.js'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository.js'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { CreateEmployee, Employee, SimpleEmployee } from '../types/index.js'
import { UTCDateMini } from '@date-fns/utc'
import { differenceInYears, endOfDay, startOfDay } from 'date-fns'
import { Logger } from 'pino'

export class EmployeeService implements IEmployeeService {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly companyRepository: ICompanyRepository,
    private readonly departmentRepository: IDepartmentRepository,
    private readonly employeeTypeRepository: IEmployeeTypeRepository,
    private readonly logger: Logger
  ) {}

  private ageOnTodayUTC(birthdate: Date): number {
    const today = new UTCDateMini()
    return differenceInYears(today, birthdate)
  }

  private todayBoundsUTC() {
    const today = new UTCDateMini()
    return {
      start: startOfDay(today),
      end: endOfDay(today),
    }
  }

  async createEmployee(data: CreateEmployee): Promise<Result<Employee, Error>> {
    if (!data.name || data.name.trim().length === 0) {
      this.logger.warn({ data }, 'Employee creation failed: name is required')
      return failure(new ValidationError('Name is required', 'name'))
    }

    const companyExists = await this.companyRepository.getCompanyById(data.companyId)
    if (!companyExists) {
      this.logger.warn({ companyId: data.companyId }, 'Employee creation failed: invalid company ID')
      return failure(new ValidationError('Invalid company ID', 'companyId'))
    }

    const departmentExists = await this.departmentRepository.getDepartmentById(data.departmentId)
    if (!departmentExists) {
      this.logger.warn(
        { companyId: data.companyId, departmentId: data.departmentId },
        'Employee creation failed: invalid department ID'
      )
      return failure(new ValidationError('Invalid department ID', 'departmentId'))
    }

    const employeeTypeExists = await this.employeeTypeRepository.getEmployeeTypeById(data.employeeTypeId)
    if (!employeeTypeExists) {
      this.logger.warn(
        { companyId: data.companyId, employeeTypeId: data.employeeTypeId },
        'Employee creation failed: invalid employee type'
      )
      return failure(new ValidationError('Invalid employee type', 'employeeTypeId'))
    }

    const age = this.ageOnTodayUTC(data.birthdate)
    if (age < 13) {
      this.logger.warn({ birthdate: data.birthdate, age }, 'Employee creation failed: age is below 13')
      return failure(new ValidationError('Must be over the age of 13 to be employed', 'birthday'))
    }

    try {
      const employee = await this.employeeRepository.createEmployee({
        ...data,
      })
      return success(employee)
    } catch (error) {
      this.logger.error({ error, data }, 'Error creating employee')
      return failure(new DatabaseError('Database error occurred while creating the employee'))
    }
  }

  async getEmployeeById(id: number): Promise<Result<Employee, Error>> {
    try {
      const employee = await this.employeeRepository.getEmployeeById(id)
      if (!employee) {
        this.logger.debug({ id }, 'Employee not found by ID')
        return failure(new EntityNotFoundError(`Employee with ID ${id} not found`))
      }
      return success(employee)
    } catch (error) {
      this.logger.error({ error, id }, 'Error fetching employee by ID')
      return failure(new DatabaseError('Database error occurred while fetching the employee'))
    }
  }

  async getAllEmployees(): Promise<Result<Employee[], Error>> {
    try {
      const employees = await this.employeeRepository.getAllEmployees()
      return success(employees)
    } catch (error) {
      this.logger.error({ error }, 'Error fetching all employees')
      return failure(new DatabaseError('Database error occurred while fetching employees'))
    }
  }

  async getAllEmployeesByCompanyId(companyId: number): Promise<Result<Employee[], Error>> {
    try {
      const employees = await this.employeeRepository.getActiveEmployeesByCompanyId(companyId)
      return success(employees)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Error fetching all employees by company ID')
      return failure(new DatabaseError('Database error occurred while fetching employees'))
    }
  }

  async updateEmployee(id: number, data: Partial<Omit<Employee, 'id'>>): Promise<Result<Employee, Error>> {
    try {
      const existingEmployee = await this.employeeRepository.getEmployeeById(id)
      if (!existingEmployee) {
        this.logger.warn({ id }, 'Employee update failed: entity not found')
        return failure(new EntityNotFoundError(`Employee with ID ${id} not found`))
      }

      if (data.name && data.name.trim().length === 0) {
        this.logger.warn({ id, data }, 'Employee update failed: name cannot be empty')
        return failure(new ValidationError('Name cannot be empty', 'name'))
      }

      if (data.companyId) {
        const companyExists = await this.companyRepository.getCompanyById(data.companyId)
        if (!companyExists) {
          this.logger.warn({ id, companyId: data.companyId }, 'Employee update failed: invalid company ID')
          return failure(new ValidationError('Invalid company ID', 'companyId'))
        }
      }

      if (data.departmentId) {
        const departmentExists = await this.departmentRepository.getDepartmentById(data.departmentId)
        if (!departmentExists) {
          this.logger.warn({ id, departmentId: data.departmentId }, 'Employee update failed: invalid department ID')
          return failure(new ValidationError('Invalid department ID', 'departmentId'))
        }
      }

      if (data.employeeTypeId) {
        const employeeTypeExists = await this.employeeTypeRepository.getEmployeeTypeById(data.employeeTypeId)
        if (!employeeTypeExists) {
          this.logger.warn(
            { id, employeeTypeId: data.employeeTypeId },
            'Employee update failed: invalid employee type ID'
          )
          return failure(new ValidationError('Invalid employee type ID', 'employeeTypeId'))
        }
      }

      if (data.birthdate) {
        const age = this.ageOnTodayUTC(data.birthdate)
        if (age < 13) {
          this.logger.warn({ id, birthdate: data.birthdate, age }, 'Employee update failed: age is below 13')
          return failure(new ValidationError('Employee must be at least 13 years old', 'birthday'))
        }
      }

      const updatedEmployee = await this.employeeRepository.updateEmployee(id, data)
      return success(updatedEmployee)
    } catch (error) {
      this.logger.error({ error, id, data }, `Error updating employee with ID ${id}`)
      return failure(new DatabaseError('Database error occurred while updating the employee'))
    }
  }

  async updateProfilePicture(id: number, filePath: string): Promise<Result<Employee, Error>> {
    try {
      const existingEmployee = await this.employeeRepository.getEmployeeById(id)
      if (!existingEmployee) {
        this.logger.warn({ id }, 'Profile picture update failed: employee not found')
        return failure(new EntityNotFoundError(`Employee with ID ${id} not found`))
      }

      const updatedEmployee = await this.employeeRepository.updateEmployee(id, {
        ...existingEmployee,
        profilePicturePath: filePath,
      })

      return success(updatedEmployee)
    } catch (error) {
      this.logger.error({ error, id, filePath }, `Error updating profile picture for employee with ID ${id}`)
      return failure(new DatabaseError('Database error occurred while updating the profile picture'))
    }
  }

  async deleteEmployee(id: number): Promise<Result<Employee, Error>> {
    try {
      const deletedEmployee = await this.employeeRepository.softDeleteEmployee(id)
      return success(deletedEmployee)
    } catch (error) {
      this.logger.error({ error, id }, `Error deleting employee with ID ${id}`)
      return failure(new DatabaseError('Database error occurred while deleting the employee'))
    }
  }

  async getAllEmployeesByDepartmentIdAndCompanyId(
    departmentId: number,
    companyId: number
  ): Promise<Result<Employee[], Error>> {
    try {
      const employees = await this.employeeRepository.getAllEmployeesByCompanyIdAndDepartmentId(companyId, departmentId)
      return success(employees)
    } catch (error) {
      this.logger.error({ error, companyId, departmentId }, 'Error fetching employees by company and department ID')
      return failure(new DatabaseError('Database error while fetching employees'))
    }
  }

  async getSimpleEmployees(companyId: number): Promise<Result<SimpleEmployee[], Error>> {
    try {
      const { start, end } = this.todayBoundsUTC()
      const emps = await this.employeeRepository.getSimpleEmployeesByCompanyIdWithTodayAbsence(companyId, start, end)
      return success(emps)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Error fetching simple employees by company')
      return failure(new DatabaseError('Database error while fetching simple employees'))
    }
  }

  async getSimpleEmployeesByDepartment(
    companyId: number,
    departmentId: number
  ): Promise<Result<SimpleEmployee[], Error>> {
    try {
      const { start, end } = this.todayBoundsUTC()
      const emps = await this.employeeRepository.getSimpleEmployeesByCompanyAndDepartmentWithTodayAbsence(
        companyId,
        departmentId,
        start,
        end
      )
      return success(emps)
    } catch (error) {
      this.logger.error({ error, companyId, departmentId }, 'Error fetching simple employees by department')
      return failure(new DatabaseError('Database error while fetching simple employees by department'))
    }
  }
}
