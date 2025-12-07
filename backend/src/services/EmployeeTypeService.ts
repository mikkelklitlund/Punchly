import { DatabaseError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IEmployeeTypeService } from '../interfaces/services/IEmployeeTypeService.js'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository.js'
import { EmployeeType } from '../types/index.js'
import { Logger } from 'pino'

export class EmployeeTypeService implements IEmployeeTypeService {
  constructor(
    private readonly employeeTypeRepository: IEmployeeTypeRepository,
    private readonly logger: Logger
  ) {}

  async createEmployeeType(typeName: string, companyId: number): Promise<Result<EmployeeType, Error>> {
    if (!typeName || typeName.trim().length === 0) {
      this.logger.warn({ companyId, typeName }, 'Employee type creation failed: name is required')
      return failure(new ValidationError('Type name is required.'))
    }

    if (await this.employeeTypeRepository.employeeTypeExistsOnCompanyId(companyId, typeName)) {
      this.logger.warn({ companyId, typeName }, 'Employee type creation failed: type already exists on company')
      return failure(new ValidationError('Type already exists.'))
    }

    try {
      const employeeType = await this.employeeTypeRepository.createEmployeeType(typeName, companyId)
      return success(employeeType)
    } catch (error) {
      this.logger.error({ error, companyId, typeName }, 'Error creating employee type')
      return failure(new DatabaseError('Database error occurred while creating the employee type.'))
    }
  }

  async getEmployeeTypesByCompanyId(companyId: number): Promise<Result<EmployeeType[], Error>> {
    try {
      const types = await this.employeeTypeRepository.getEmployeeTypeByCompanyId(companyId)
      return success(types)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Error getting employee type by company ID')
      return failure(new DatabaseError('Database error occurred while getting the employee type.'))
    }
  }

  async deleteEmployeeTypeFromCompany(companyId: number, typeName: string): Promise<Result<EmployeeType, Error>> {
    try {
      const type = await this.employeeTypeRepository.deleteEmployeeTypeByCompanyIdAndName(companyId, typeName)
      return success(type)
    } catch (error) {
      this.logger.error({ error, companyId, typeName }, 'Error deleting employee type by company/name')
      return failure(new DatabaseError('Database error occurred while deleting the employee type.'))
    }
  }

  async deleteEmployeeType(employeeTypeId: number): Promise<Result<EmployeeType, Error>> {
    try {
      const type = await this.employeeTypeRepository.deleteEmployeeType(employeeTypeId)
      return success(type)
    } catch (error) {
      this.logger.error({ error, employeeTypeId }, 'Error deleting employee type by ID')
      return failure(new DatabaseError('Database error occurred while deleting the employee type.'))
    }
  }

  async renameEmployeeType(employeeTypeId: number, newName: string): Promise<Result<EmployeeType, Error>> {
    if (!newName || newName.trim().length === 0) {
      this.logger.warn({ employeeTypeId, newName }, 'Employee type rename failed: new name is required')
      return failure(new ValidationError('New name is required.'))
    }

    try {
      const types = await this.employeeTypeRepository.updateEmployeeType(employeeTypeId, { name: newName })
      return success(types)
    } catch (error) {
      this.logger.error({ error, employeeTypeId, newName }, 'Error renaming employee type')
      return failure(new DatabaseError('Database error occurred while updating the employee type.'))
    }
  }
}
