import { AbsenceType } from 'shared'
import { DatabaseError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IAbsenceTypeService } from '../interfaces/services/IAbsenceTypeService.js'
import { IAbsenceTypeRepository } from '../interfaces/repositories/IAbsenceTypeRepository.js'

export class AbsenceTypeService implements IAbsenceTypeService {
  constructor(private readonly absenceTypeRepository: IAbsenceTypeRepository) {}

  async createAbsenceType(typeName: string, companyId: number): Promise<Result<AbsenceType, Error>> {
    if (!typeName || typeName.trim().length === 0) {
      return failure(new ValidationError('Type name is required.'))
    }

    try {
      const exists = await this.absenceTypeRepository.absenceTypeExistsOnCompanyId(companyId, typeName)
      if (exists) {
        return failure(new ValidationError('Type already exists.'))
      }

      const type = await this.absenceTypeRepository.createAbsenceType(typeName, companyId)
      return success(type)
    } catch (error) {
      console.error('Error creating absence type:', error)
      return failure(new DatabaseError('Database error occurred while creating the absence type.'))
    }
  }

  async getAbsenceTypesByCompanyId(companyId: number): Promise<Result<AbsenceType[], Error>> {
    try {
      const types = await this.absenceTypeRepository.getAbsenceTypesByCompanyId(companyId)
      return success(types)
    } catch (error) {
      console.error('Error getting absence types:', error)
      return failure(new DatabaseError('Database error occurred while getting the absence types.'))
    }
  }

  async deleteAbsenceTypeFromCompany(companyId: number, typeName: string): Promise<Result<AbsenceType, Error>> {
    try {
      const type = await this.absenceTypeRepository.deleteAbsenceTypeByCompanyIdAndName(companyId, typeName)
      return success(type)
    } catch (error) {
      console.error('Error deleting absence type by company/name:', error)
      return failure(new DatabaseError('Database error occurred while deleting the absence type.'))
    }
  }

  async deleteAbsenceType(absenceTypeId: number): Promise<Result<AbsenceType, Error>> {
    try {
      const type = await this.absenceTypeRepository.deleteAbsenceType(absenceTypeId)
      return success(type)
    } catch (error) {
      console.error('Error deleting absence type:', error)
      return failure(new DatabaseError('Database error occurred while deleting the absence type.'))
    }
  }

  async renameAbsenceType(absenceTypeId: number, newName: string): Promise<Result<AbsenceType, Error>> {
    if (!newName || newName.trim().length === 0) {
      return failure(new ValidationError('New name is required.'))
    }

    try {
      const type = await this.absenceTypeRepository.updateAbsenceType(absenceTypeId, { name: newName })
      return success(type)
    } catch (error) {
      console.error('Error renaming absence type:', error)
      return failure(new DatabaseError('Database error occurred while renaming the absence type.'))
    }
  }
}
