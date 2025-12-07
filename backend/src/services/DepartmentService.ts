import { DatabaseError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IDepartmentRepository } from '../interfaces/repositories/IDepartmentRepository.js'
import { IDepartmentService } from '../interfaces/services/IDepartmentService.js'
import { Department } from '../types/index.js'
import { Logger } from 'pino'

export class DepartmentService implements IDepartmentService {
  constructor(
    private readonly departmentRepository: IDepartmentRepository,
    private readonly logger: Logger
  ) {}

  async createDepartment(companyId: number, name: string): Promise<Result<Department, Error>> {
    try {
      const department = await this.departmentRepository.createDepartment(name, companyId)
      return success(department)
    } catch (error) {
      this.logger.error({ error, companyId, name }, 'Error during creation of department')
      return failure(new DatabaseError('Database error occured during creation of department'))
    }
  }

  async getDepartmentsByCompanyId(companyId: number): Promise<Result<Department[], Error>> {
    try {
      const departments = await this.departmentRepository.getAllDepartmentsByCompanyId(companyId)
      return success(departments)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Database error while getting departments')
      return failure(new DatabaseError('Database error occured during fetching of departments'))
    }
  }

  async deleteDepartmentByNameAndCompanyId(companyId: number, name: string): Promise<Result<Department, Error>> {
    try {
      const department = await this.departmentRepository.deleteDepartmentByCompanyIdAndName(companyId, name)
      return success(department)
    } catch (error) {
      this.logger.error({ error, companyId, name }, 'Database error while deleting department by name and company')
      return failure(new DatabaseError('Database error occured during deletion of department'))
    }
  }

  async renameDepartment(departmentId: number, newName: string): Promise<Result<Department, Error>> {
    try {
      const department = await this.departmentRepository.updateDepartment(departmentId, { name: newName })
      return success(department)
    } catch (error) {
      this.logger.error({ error, departmentId, newName }, 'Database error while renaming department')
      return failure(new DatabaseError('Database error occured during update of department'))
    }
  }

  async deleteDepartment(departmentId: number): Promise<Result<Department, Error>> {
    try {
      const department = await this.departmentRepository.deleteDepartment(departmentId)
      return success(department)
    } catch (error) {
      this.logger.error({ error, departmentId }, 'Database error while deleting department by ID')
      return failure(new DatabaseError('Database error occured during deletion of department'))
    }
  }
}
