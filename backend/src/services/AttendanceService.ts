import { Result, success, failure } from '../utils/Result.js'
import { ValidationError, DatabaseError, EntityNotFoundError } from '../utils/Errors.js'
import { CreateAttendanceRecord, AttendanceRecord } from 'shared'
import { IAttendanceRecordRepository } from '../interfaces/repositories/IAttendanceRecordRepository.js'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'

export class AttendanceService implements IAttendanceService {
  constructor(
    private readonly attendanceRecordRepository: IAttendanceRecordRepository,
    private readonly employeeRepository: IEmployeeRepository
  ) {}

  async createAttendanceRecord(newAttendance: CreateAttendanceRecord): Promise<Result<AttendanceRecord, Error>> {
    try {
      const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord(newAttendance)
      await this.employeeRepository.updateEmployee(newAttendance.employeeId, { checkedIn: true })
      return success(attendanceRecord)
    } catch (error) {
      console.error('Error creating attendance record:', error)
      return failure(new DatabaseError('Database error occurred while creating the attendance record.'))
    }
  }

  async checkInEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const openRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId)

      if (openRecord) {
        await this.attendanceRecordRepository.updateAttendanceRecord(openRecord.id, {
          checkOut: undefined,
          autoClosed: true,
        })
      }

      const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord({
        employeeId,
        checkIn: new Date(),
      })

      await this.employeeRepository.updateEmployee(employeeId, { checkedIn: true })

      return success(attendanceRecord)
    } catch (error) {
      console.error('Error during employee check-in:', error)
      return failure(new DatabaseError('Database error occurred during check-in.'))
    }
  }

  async checkOutEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const attendanceRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId)

      if (!attendanceRecord) {
        return failure(new EntityNotFoundError('No ongoing attendance record found for this employee.'))
      }

      const updatedRecord = await this.attendanceRecordRepository.updateAttendanceRecord(attendanceRecord.id, {
        checkOut: new Date(),
      })

      await this.employeeRepository.updateEmployee(employeeId, { checkedIn: false })

      return success(updatedRecord)
    } catch (error) {
      console.error('Error during employee check-out:', error)
      return failure(new DatabaseError('Database error occurred during check-out.'))
    }
  }

  async getAttendanceRecordById(id: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const attendanceRecord = await this.attendanceRecordRepository.getAttendanceRecordById(id)
      if (!attendanceRecord) {
        return failure(new EntityNotFoundError(`Attendance record with ID ${id} not found.`))
      }
      return success(attendanceRecord)
    } catch (error) {
      console.error('Error fetching attendance record by ID:', error)
      return failure(new DatabaseError('Database error occurred while fetching the attendance record.'))
    }
  }

  async getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Result<AttendanceRecord[], Error>> {
    try {
      const attendanceRecords = await this.attendanceRecordRepository.getAttendanceRecordsByEmployeeIdAndPeriod(
        employeeId,
        periodStart,
        periodEnd
      )
      return success(attendanceRecords)
    } catch (error) {
      console.error('Error fetching attendance records for employee by month:', error)
      return failure(new DatabaseError('Database error occurred while fetching attendance records.'))
    }
  }

  async updateAttendanceRecord(
    id: number,
    data: Partial<Omit<AttendanceRecord, 'id'>>
  ): Promise<Result<AttendanceRecord, Error>> {
    if (!data) {
      return failure(new ValidationError('Update data is required.'))
    }

    try {
      const updatedAttendanceRecord = await this.attendanceRecordRepository.updateAttendanceRecord(id, data)
      return success(updatedAttendanceRecord)
    } catch (error) {
      console.error('Error updating attendance record:', error)
      return failure(new DatabaseError('Database error occurred while updating the attendance record.'))
    }
  }

  async deleteAttendanceRecord(id: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const deletedAttendanceRecord = await this.attendanceRecordRepository.deleteAttendanceRecord(id)
      return success(deletedAttendanceRecord)
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      return failure(new DatabaseError('Database error occurred while deleting the attendance record.'))
    }
  }

  async getLast30AttendanceRecords(employeeId: number): Promise<Result<AttendanceRecord[], Error>> {
    try {
      const records = await this.attendanceRecordRepository.getLast30ByEmployeeId(employeeId)
      return success(records)
    } catch (error) {
      console.error('Error fetching last 30 attendance records:', error)
      return failure(new DatabaseError('Database error occurred while fetching recent attendance records.'))
    }
  }
}
