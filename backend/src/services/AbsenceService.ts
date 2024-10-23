import { AbsenceRecord, CreateAbsenceRecord } from 'shared'
import { DatabaseError, EntityNotFoundError, ValidationError } from '../utils/Errors'
import { failure, Result, success } from '../utils/Result'
import { isBefore } from 'date-fns'
import { IAbsenceService } from '../interfaces/services/IAbsenceService'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository'

export class AbsenceService implements IAbsenceService {
  constructor(private readonly absenceRecordRepository: IAbsenceRecordRepository) {}

  async createAbsenceRecord(newAbsence: CreateAbsenceRecord): Promise<Result<AbsenceRecord, Error>> {
    if (isBefore(newAbsence.endDate, newAbsence.startDate)) {
      return failure(new ValidationError('Enddate is before startdate'))
    }

    try {
      const absence = await this.absenceRecordRepository.createAbsenceRecord(newAbsence)
      return success(absence)
    } catch (error) {
      console.error('Error creating absence record:', error)
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

  async updateAbsenceRecord(id: number, data: Partial<CreateAbsenceRecord>): Promise<Result<AbsenceRecord, Error>> {
    if (data.endDate && data.startDate && isBefore(data.endDate, data.startDate)) {
      return failure(new ValidationError('End date cannot be before start date.'))
    }

    try {
      const updatedAbsence = await this.absenceRecordRepository.updateAbsenceRecord(id, data)
      return success(updatedAbsence)
    } catch (error) {
      console.error('Error updating absence record:', error)
      return failure(new DatabaseError('Database error occurred while updating the absence record.'))
    }
  }

  async deleteAbsenceRecord(id: number): Promise<Result<AbsenceRecord, Error>> {
    try {
      const absence = await this.absenceRecordRepository.getAbsenceRecordById(id)
      if (!absence) {
        return failure(new EntityNotFoundError(`Absence record with ID ${id} not found.`))
      }

      const deletedAbsence = await this.absenceRecordRepository.deleteAbsenceRecord(id)
      return success(deletedAbsence)
    } catch (error) {
      console.error('Error deleting absence record:', error)
      return failure(new DatabaseError('Database error occurred while deleting the absence record.'))
    }
  }
}
