import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { AbsenceRecord, CreateAbsenceRecord } from '../types/index.js'

export class AbsenceService implements IAbsenceService {
  constructor(private readonly absenceRecordRepository: IAbsenceRecordRepository) {}

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart <= bEnd && aEnd >= bStart
  }

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<Result<AbsenceRecord, Error>> {
    if (data.endDate < data.startDate) {
      return failure(new ValidationError('endDate cannot be before startDate'))
    }

    const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(
      data.employeeId,
      data.startDate,
      data.endDate
    )

    if (overlaps.length > 0) {
      return failure(new ValidationError('Employee already has an absence overlapping this period.'))
    }

    const created = await this.absenceRecordRepository.createAbsenceRecord(data)
    return success(created)
  }

  async getAbsenceRecordById(id: number): Promise<Result<AbsenceRecord, Error>> {
    try {
      const absence = await this.absenceRecordRepository.getAbsenceRecordById(id)
      if (!absence) return failure(new EntityNotFoundError(`Absence record with ID ${id} not found.`))
      return success(absence)
    } catch (error) {
      console.error('Error fetching absence record by ID:', error)
      return failure(new DatabaseError('Database error occurred while fetching the absence record.'))
    }
  }

  async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<Result<AbsenceRecord[], Error>> {
    try {
      const absences = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeId(employeeId)
      return success(absences)
    } catch (error) {
      console.error('Error fetching absence records for employee:', error)
      return failure(new DatabaseError('Database error occurred while fetching absence records.'))
    }
  }

  async getAbsenceRecordsByEmployeeIdAndRange(
    employeeId: number,
    start: Date,
    end: Date
  ): Promise<Result<AbsenceRecord[], Error>> {
    try {
      const absences = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(employeeId, start, end)
      return success(absences)
    } catch (error) {
      if (error instanceof ValidationError) return failure(error)
      console.error('Error fetching absence records by date range:', error)
      return failure(new DatabaseError('Database error occurred while fetching absence records.'))
    }
  }

  async updateAbsenceRecord(
    id: number,
    patch: Partial<Omit<AbsenceRecord, 'id'>>
  ): Promise<Result<AbsenceRecord, Error>> {
    try {
      const existing = await this.absenceRecordRepository.getAbsenceRecordById(id)
      if (!existing) return failure(new EntityNotFoundError('Absence record not found'))

      if (patch.employeeId && patch.employeeId !== existing.employeeId) {
        return failure(new ValidationError('Cannot change employee on an existing absence record.', 'employeeId'))
      }

      const startDate = patch.startDate ?? existing.startDate
      const endDate = patch.endDate ?? existing.endDate

      if (endDate < startDate) {
        return failure(new ValidationError('endDate cannot be before startDate'))
      }

      const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(
        existing.employeeId,
        startDate,
        endDate
      )

      const hasOther = overlaps.some((r) => r.id !== id && this.overlaps(startDate, endDate, r.startDate, r.endDate))

      if (hasOther) {
        return failure(new ValidationError('Employee already has an absence overlapping this period.'))
      }

      const updated = await this.absenceRecordRepository.updateAbsenceRecord(id, {
        ...patch,
        startDate,
        endDate,
      })
      return success(updated)
    } catch (err) {
      if (err instanceof ValidationError) return failure(err)
      console.error('Error updating absence record:', err)
      return failure(new DatabaseError('Database error occurred while updating the absence record.'))
    }
  }

  async deleteAbsenceRecord(id: number): Promise<Result<AbsenceRecord, Error>> {
    try {
      const deleted = await this.absenceRecordRepository.deleteAbsenceRecord(id)
      return success(deleted)
    } catch (e) {
      console.error('Error deleting absence record:', e)
      return failure(new DatabaseError('Database error occurred while deleting the absence record.'))
    }
  }
}
