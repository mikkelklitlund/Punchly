import { AbsenceRecord, CreateAbsenceRecord } from 'shared'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { isBefore } from 'date-fns'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'

export class AbsenceService implements IAbsenceService {
  constructor(private readonly absenceRecordRepository: IAbsenceRecordRepository) {}

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart <= bEnd && aEnd >= bStart
  }

  private validateRange(start: Date, end: Date): ValidationError | null {
    if (!start || !end) return new ValidationError('startDate and endDate are required')
    if (end < start) return new ValidationError('endDate cannot be before startDate')
    return null
  }

  // Optional: treat absences as full-day windows
  private asWholeDayRange(start: Date, end: Date) {
    const s = new Date(start)
    s.setHours(0, 0, 0, 0)
    const e = new Date(end)
    e.setHours(23, 59, 59, 999)
    return [s, e] as const
  }

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<Result<AbsenceRecord, Error>> {
    const err = this.validateRange(data.startDate, data.endDate)
    if (err) return failure(err)

    // const [s, e] = this.asWholeDayRange(data.startDate, data.endDate)
    const s = data.startDate
    const e = data.endDate

    try {
      const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(data.employeeId, s, e)
      if (overlaps.length > 0) {
        return failure(new ValidationError('Employee already has an absence overlapping this period.'))
      }

      const created = await this.absenceRecordRepository.createAbsenceRecord({
        ...data,
        startDate: s,
        endDate: e,
      })
      return success(created)
    } catch (e) {
      console.error('Error creating absence record:', e)
      return failure(new DatabaseError('Database error occurred while creating the absence record.'))
    }
  }

  async getAbsenceRecordById(id: number): Promise<Result<AbsenceRecord, Error>> {
    try {
      const absence = await this.absenceRecordRepository.getAbsenceRecordById(id)
      if (!absence) {
        return failure(new EntityNotFoundError(`Absence record with ID ${id} not found.`))
      }
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
    if (isBefore(end, start)) {
      return failure(new ValidationError('End date cannot be before start date.'))
    }

    try {
      const absences = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(employeeId, start, end)
      return success(absences)
    } catch (error) {
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

      // Disallow moving to another employee
      if (patch.employeeId && patch.employeeId !== existing.employeeId) {
        return failure(new ValidationError('Cannot change employee on an existing absence record.', 'employeeId'))
      }

      // const [s, e] = this.asWholeDayRange(patch.startDate ?? existing.startDate, patch.endDate ?? existing.endDate)
      const s = patch.startDate ?? existing.startDate
      const e = patch.endDate ?? existing.endDate

      const err = this.validateRange(s, e)
      if (err) return failure(err)

      const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(
        existing.employeeId,
        s,
        e
      )
      const hasOther = overlaps.some((r) => r.id !== id && this.overlaps(s, e, r.startDate, r.endDate))
      if (hasOther) {
        return failure(new ValidationError('Employee already has an absence overlapping this period.'))
      }

      const updated = await this.absenceRecordRepository.updateAbsenceRecord(id, {
        ...patch,
        startDate: s,
        endDate: e,
      })
      return success(updated)
    } catch (e) {
      console.error('Error updating absence record:', e)
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
