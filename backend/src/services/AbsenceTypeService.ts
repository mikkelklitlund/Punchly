import { DatabaseError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IAbsenceTypeService } from '../interfaces/services/IAbsenceTypeService.js'
import { IAbsenceTypeRepository } from '../interfaces/repositories/IAbsenceTypeRepository.js'
import { AbsenceType } from '../types/index.js'
import { Logger } from 'pino'

export class AbsenceTypeService implements IAbsenceTypeService {
  constructor(
    private readonly absenceTypeRepository: IAbsenceTypeRepository,
    private readonly logger: Logger
  ) {}

  async createAbsenceType(typeName: string, companyId: number): Promise<Result<AbsenceType, Error>> {
    if (!typeName || typeName.trim().length === 0) {
      this.logger.warn({ companyId, typeName }, 'Absence type creation failed: name is required')
      return failure(new ValidationError('Type name is required.'))
    }

    try {
      const exists = await this.absenceTypeRepository.absenceTypeExistsOnCompanyId(companyId, typeName)
      if (exists) {
        this.logger.warn({ companyId, typeName }, 'Absence type creation failed: type already exists on company')
        return failure(new ValidationError('Type already exists.'))
      }

      const type = await this.absenceTypeRepository.createAbsenceType(typeName, companyId)
      return success(type)
    } catch (error) {
      this.logger.error({ error, companyId, typeName }, 'Error creating absence type')
      return failure(new DatabaseError('Database error occurred while creating the absence type.'))
    }
  }

  async getAbsenceTypesByCompanyId(companyId: number): Promise<Result<AbsenceType[], Error>> {
    try {
      const types = await this.absenceTypeRepository.getAbsenceTypesByCompanyId(companyId)
      return success(types)
    } catch (error) {
      this.logger.error({ error, companyId }, 'Error getting absence types by company ID')
      return failure(new DatabaseError('Database error occurred while getting the absence types.'))
    }
  }

  async deleteAbsenceTypeFromCompany(companyId: number, typeName: string): Promise<Result<AbsenceType, Error>> {
    try {
      const type = await this.absenceTypeRepository.deleteAbsenceTypeByCompanyIdAndName(companyId, typeName)
      return success(type)
    } catch (error) {
      this.logger.error({ error, companyId, typeName }, 'Error deleting absence type by company/name')
      return failure(new DatabaseError('Database error occurred while deleting the absence type.'))
    }
  }

  async deleteAbsenceType(absenceTypeId: number): Promise<Result<AbsenceType, Error>> {
    try {
      const type = await this.absenceTypeRepository.deleteAbsenceType(absenceTypeId)
      return success(type)
    } catch (error) {
      this.logger.error({ error, absenceTypeId }, 'Error deleting absence type by ID')
      return failure(new DatabaseError('Database error occurred while deleting the absence type.'))
    }
  }

  async renameAbsenceType(absenceTypeId: number, newName: string): Promise<Result<AbsenceType, Error>> {
    if (!newName || newName.trim().length === 0) {
      this.logger.warn({ absenceTypeId, newName }, 'Absence type rename failed: new name is required')
      return failure(new ValidationError('New name is required.'))
    }

    try {
      const type = await this.absenceTypeRepository.updateAbsenceType(absenceTypeId, { name: newName })
      return success(type)
    } catch (error) {
      this.logger.error({ error, absenceTypeId, newName }, 'Error renaming absence type')
      return failure(new DatabaseError('Database error occurred while renaming the absence type.'))
    }
  }
}
