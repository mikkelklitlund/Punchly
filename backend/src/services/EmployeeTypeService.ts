import { EmployeeType } from 'shared'
import { DatabaseError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IEmployeeTypeService } from '../interfaces/services/IEmployeeTypeService.js'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository.js'

export class EmployeeTypeService implements IEmployeeTypeService {
  constructor(private readonly employeeTypeRepository: IEmployeeTypeRepository) {}

  async createEmployeeType(typeName: string, companyId: number): Promise<Result<EmployeeType, Error>> {
    if (!typeName || typeName.trim().length === 0) {
      return failure(new ValidationError('Type name is required.'))
    }

    if (await this.employeeTypeRepository.employeeTypeExistsOnCompanyId(companyId, typeName)) {
      return failure(new ValidationError('Type already exists.'))
    }

    try {
      const employeeType = await this.employeeTypeRepository.createEmployeeType(typeName, companyId)
      return success(employeeType)
    } catch (error) {
      console.error('Error creating employee type:', error)
      return failure(new DatabaseError('Database error occurred while creating the employee type.'))
    }
  }

  async getEmployeeTypesByCompanyId(companyId: number): Promise<Result<EmployeeType[], Error>> {
    try {
      const types = await this.employeeTypeRepository.getEmployeeTypeByCompanyId(companyId)
      return success(types)
    } catch (error) {
      console.error('Error getting employee type:', error)
      return failure(new DatabaseError('Database error occurred while getting the employee type.'))
    }
  }

  async deleteEmployeeTypeFromCompany(companyId: number, typeName: string): Promise<Result<EmployeeType, Error>> {
    try {
      const type = await this.employeeTypeRepository.deleteEmployeeTypeByCompanyIdAndName(companyId, typeName)
      return success(type)
    } catch (error) {
      console.error('Error deleting employee type:', error)
      return failure(new DatabaseError('Database error occurred while deleting the employee type.'))
    }
  }
}
