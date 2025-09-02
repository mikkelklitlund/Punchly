import { AbsenceRecord, CreateAbsenceRecord } from 'shared'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { toUTC, startOfDayUTC, endOfDayUTC } from '../utils/date.js'
import { DateInput } from '../types/index.js'

export class AbsenceService implements IAbsenceService {
  constructor(private readonly absenceRecordRepository: IAbsenceRecordRepository) {}

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart <= bEnd && aEnd >= bStart
  }

  private validateRange(start: DateInput, end: DateInput): { s: Date; e: Date } {
    if (start == null || end == null) throw new ValidationError('startDate and endDate are required')
    const s = toUTC(start)
    const e = toUTC(end)
    if (e < s) throw new ValidationError('endDate cannot be before startDate')
    return { s, e }
  }

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<Result<AbsenceRecord, Error>> {
    try {
      let { s, e } = this.validateRange(data.startDate, data.endDate)

      s = startOfDayUTC(s)
      e = endOfDayUTC(e)

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
    } catch (err) {
      if (err instanceof ValidationError) return failure(err)
      console.error('Error creating absence record:', err)
      return failure(new DatabaseError('Database error occurred while creating the absence record.'))
    }
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
    start: DateInput,
    end: DateInput
  ): Promise<Result<AbsenceRecord[], Error>> {
    try {
      let { s, e } = this.validateRange(start, end)
      // If whole-day absences, keep ranges aligned to UTC days for searching
      s = startOfDayUTC(s)
      e = endOfDayUTC(e)

      const absences = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(employeeId, s, e)
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

      let { s, e } = this.validateRange(patch.startDate ?? existing.startDate, patch.endDate ?? existing.endDate)

      s = startOfDayUTC(s)
      e = endOfDayUTC(e)

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
