import { Employee, CreateEmployee } from 'shared'
import { Result, failure, success } from '../utils/Result'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors'
import { IEmployeeRepository } from 'src/interfaces/repositories/IEmployeeRepositry'
import { ICompanyRepository } from 'src/interfaces/repositories/ICompanyRepository'
import { IDepartmentRepository } from 'src/interfaces/repositories/IDepartmentRepository'
import { IEmployeeTypeRepository } from 'src/interfaces/repositories/IEmployeeTypeRepository'
import { IEmployeeService } from 'src/interfaces/services/IEmployeeService'

export class EmployeeService implements IEmployeeService {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly companyRepository: ICompanyRepository,
    private readonly departmentRepository: IDepartmentRepository,
    private readonly employeeTypeRepository: IEmployeeTypeRepository
  ) {}

  async createEmployee(data: CreateEmployee): Promise<Result<Employee, Error>> {
    if (!data.name || data.name.trim().length === 0) {
      return failure(new ValidationError('Name is required', 'name'))
    }

    const companyExists = await this.companyRepository.getCompanyById(data.companyId)
    if (!companyExists) {
      return failure(new ValidationError('Invalid company ID', 'companyId'))
    }

    const departmentExists = await this.departmentRepository.getDepartmentById(data.departmentId)
    if (!departmentExists) {
      return failure(new ValidationError('Invalid department ID', 'departmentId'))
    }

    const employeeTypeExists = await this.employeeTypeRepository.getEmployeeTypeById(data.employeeTypeId)
    if (!employeeTypeExists) {
      return failure(new ValidationError('Invalid employee type', 'employeeTypeId'))
    }

    if (data.monthlySalary && data.hourlySalary) {
      return failure(new ValidationError('Both monthly and hourly salary are filled', 'salary'))
    }

    if (data.monthlySalary && data.monthlySalary < 0) {
      return failure(new ValidationError('Monthly salary must be positive', 'monthlySalary'))
    }

    if (data.hourlySalary && data.hourlySalary < 0) {
      return failure(new ValidationError('Hourly salary must be positive', 'hourlySalary'))
    }

    const currentDate = new Date()
    const age = currentDate.getFullYear() - data.birthdate.getFullYear()
    if (age < 13) {
      return failure(new ValidationError('Must be over the age of 13 to be employed', 'birthday'))
    }

    try {
      const employee = await this.employeeRepository.createEmployee(data)
      return success(employee)
    } catch (error) {
      console.error('Error creating employee:', error)
      return failure(new DatabaseError('Database error occurred while creating the employee'))
    }
  }

  async getEmployeeById(id: number): Promise<Result<Employee, Error>> {
    try {
      const employee = await this.employeeRepository.getEmployeeById(id)
      if (!employee) {
        return failure(new EntityNotFoundError(`Employee with ID ${id} not found`))
      }
      return success(employee)
    } catch (error) {
      console.error('Error fetching employee by ID:', error)
      return failure(new DatabaseError('Database error occurred while fetching the employee'))
    }
  }

  async getAllEmployees(): Promise<Result<Employee[], Error>> {
    try {
      const employees = await this.employeeRepository.getAllEmployees()
      return success(employees)
    } catch (error) {
      console.error('Error fetching all employees:', error)
      return failure(new DatabaseError('Database error occurred while fetching employees'))
    }
  }

  async updateEmployee(id: number, data: Partial<Omit<Employee, 'id'>>): Promise<Result<Employee, Error>> {
    try {
      const existingEmployee = await this.employeeRepository.getEmployeeById(id)
      if (!existingEmployee) {
        return failure(new EntityNotFoundError(`Employee with ID ${id} not found`))
      }

      if (data.name && data.name.trim().length === 0) {
        return failure(new ValidationError('Name cannot be empty', 'name'))
      }

      if (data.companyId) {
        const companyExists = await this.companyRepository.getCompanyById(data.companyId)
        if (!companyExists) {
          return failure(new ValidationError('Invalid company ID', 'companyId'))
        }
      }

      if (data.departmentId) {
        const departmentExists = await this.departmentRepository.getDepartmentById(data.departmentId)
        if (!departmentExists) {
          return failure(new ValidationError('Invalid department ID', 'departmentId'))
        }
      }

      if (data.employeeTypeId) {
        const employeeTypeExists = await this.employeeTypeRepository.getEmployeeTypeById(data.employeeTypeId)
        if (!employeeTypeExists) {
          return failure(new ValidationError('Invalid employee type ID', 'employeeTypeId'))
        }
      }

      if (data.monthlySalary && data.hourlySalary) {
        return failure(
          new ValidationError('Both monthly and hourly salary cannot be filled at the same time', 'salary')
        )
      }

      if (data.monthlySalary && data.monthlySalary < 0) {
        return failure(new ValidationError('Monthly salary must be a positive number', 'monthlySalary'))
      }

      if (data.hourlySalary && data.hourlySalary < 0) {
        return failure(new ValidationError('Hourly salary must be a positive number', 'hourlySalary'))
      }

      if (data.birthdate) {
        const currentDate = new Date()
        const age = currentDate.getFullYear() - data.birthdate.getFullYear()
        if (age < 13) {
          return failure(new ValidationError('Employee must be at least 13 years old', 'birthday'))
        }
      }

      const updatedEmployee = await this.employeeRepository.updateEmployee(id, data)
      return success(updatedEmployee)
    } catch (error) {
      console.error(`Error updating employee with ID ${id}:`, error)
      return failure(new DatabaseError('Database error occurred while updating the employee'))
    }
  }

  async updateProfilePicture(id: number, filePath: string): Promise<Result<Employee, Error>> {
    try {
      const existingEmployee = await this.employeeRepository.getEmployeeById(id)
      if (!existingEmployee) {
        return failure(new EntityNotFoundError(`Employee with ID ${id} not found`))
      }

      const updatedEmployee = await this.employeeRepository.updateEmployee(id, {
        ...existingEmployee,
        profilePicturePath: filePath,
      })
      return success(updatedEmployee)
    } catch (error) {
      console.error(`Error updating profile picture for employee with ID ${id}:`, error)
      return failure(new DatabaseError('Database error occurred while updating the profile picture'))
    }
  }

  async deleteEmployee(id: number): Promise<Result<Employee, Error>> {
    try {
      const deletedEmployee = await this.employeeRepository.softDeleteEmployee(id)
      return success(deletedEmployee)
    } catch (error) {
      console.error(`Error deleting employee with ID ${id}:`, error)
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
      console.error('Error fetching employees: ', error)
      return failure(new DatabaseError('Database error while fetching employees'))
    }
  }
}
