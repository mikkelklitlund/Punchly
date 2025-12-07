import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors.js'
import { failure, Result, success } from '../utils/Result.js'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { AbsenceRecord, CreateAbsenceRecord } from '../types/index.js'
import { Logger } from 'pino'

export class AbsenceService implements IAbsenceService {
  constructor(
    private readonly absenceRecordRepository: IAbsenceRecordRepository,
    private readonly logger: Logger
  ) {}

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart <= bEnd && aEnd >= bStart
  }

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<Result<AbsenceRecord, Error>> {
    if (data.endDate < data.startDate) {
      this.logger.warn(
        { employeeId: data.employeeId, startDate: data.startDate, endDate: data.endDate },
        'Absence creation failed: endDate before startDate'
      )
      return failure(new ValidationError('endDate cannot be before startDate'))
    }

    try {
      const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(
        data.employeeId,
        data.startDate,
        data.endDate
      )

      if (overlaps.length > 0) {
        this.logger.warn(
          { employeeId: data.employeeId, startDate: data.startDate, endDate: data.endDate, overlaps: overlaps.length },
          'Absence creation failed: overlapping period found'
        )
        return failure(new ValidationError('Employee already has an absence overlapping this period.'))
      }

      const created = await this.absenceRecordRepository.createAbsenceRecord(data)
      return success(created)
    } catch (error) {
      this.logger.error({ error, data }, 'Database error during creation of absence record')
      return failure(new DatabaseError('Database error occurred while creating the absence record.'))
    }
  }

  async getAbsenceRecordById(id: number): Promise<Result<AbsenceRecord, Error>> {
    try {
      const absence = await this.absenceRecordRepository.getAbsenceRecordById(id)
      if (!absence) {
        this.logger.debug({ id }, 'Absence record not found by ID')
        return failure(new EntityNotFoundError(`Absence record with ID ${id} not found.`))
      }
      return success(absence)
    } catch (error) {
      this.logger.error({ error, id }, 'Error fetching absence record by ID')
      return failure(new DatabaseError('Database error occurred while fetching the absence record.'))
    }
  }

  async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<Result<AbsenceRecord[], Error>> {
    try {
      const absences = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeId(employeeId)
      return success(absences)
    } catch (error) {
      this.logger.error({ error, employeeId }, 'Error fetching absence records for employee')
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
      this.logger.error({ error, employeeId, start, end }, 'Error fetching absence records by date range')
      return failure(new DatabaseError('Database error occurred while fetching absence records.'))
    }
  }

  async updateAbsenceRecord(
    id: number,
    patch: Partial<Omit<AbsenceRecord, 'id'>>
  ): Promise<Result<AbsenceRecord, Error>> {
    try {
      const existing = await this.absenceRecordRepository.getAbsenceRecordById(id)
      if (!existing) {
        this.logger.warn({ id, patch }, 'Absence record update failed: entity not found')
        return failure(new EntityNotFoundError('Absence record not found'))
      }

      if (patch.employeeId && patch.employeeId !== existing.employeeId) {
        this.logger.warn(
          { id, existingEmployeeId: existing.employeeId, newEmployeeId: patch.employeeId },
          'Absence update failed: attempt to change employeeId'
        )
        return failure(new ValidationError('Cannot change employee on an existing absence record.', 'employeeId'))
      }

      const startDate = patch.startDate ?? existing.startDate
      const endDate = patch.endDate ?? existing.endDate

      if (endDate < startDate) {
        this.logger.warn({ id, startDate, endDate }, 'Absence update failed: endDate before startDate')
        return failure(new ValidationError('endDate cannot be before startDate'))
      }

      const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(
        existing.employeeId,
        startDate,
        endDate
      )

      const hasOther = overlaps.some((r) => r.id !== id && this.overlaps(startDate, endDate, r.startDate, r.endDate))

      if (hasOther) {
        this.logger.warn(
          { id, employeeId: existing.employeeId, startDate, endDate, overlaps: overlaps.length },
          'Absence update failed: overlapping period found'
        )
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
      this.logger.error({ error: err, id, patch }, 'Error updating absence record')
      return failure(new DatabaseError('Database error occurred while updating the absence record.'))
    }
  }

  async deleteAbsenceRecord(id: number): Promise<Result<AbsenceRecord, Error>> {
    try {
      const deleted = await this.absenceRecordRepository.deleteAbsenceRecord(id)
      return success(deleted)
    } catch (e) {
      this.logger.error({ error: e, id }, 'Error deleting absence record')
      return failure(new DatabaseError('Database error occurred while deleting the absence record.'))
    }
  }
}
