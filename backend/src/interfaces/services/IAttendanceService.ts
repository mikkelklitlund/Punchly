import { CreateAttendanceRecord, AttendanceRecord } from '../../types/index.js'
import { Result } from '../../utils/Result.js'

export interface IAttendanceService {
  createAttendanceRecord(newAttendance: CreateAttendanceRecord): Promise<Result<AttendanceRecord, Error>>
  checkInEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>>
  checkOutEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>>
  getAttendanceRecordById(id: number): Promise<Result<AttendanceRecord, Error>>
  getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Result<AttendanceRecord[], Error>>
  updateAttendanceRecord(
    id: number,
    data: Partial<Omit<AttendanceRecord, 'id'>>
  ): Promise<Result<AttendanceRecord, Error>>
  deleteAttendanceRecord(id: number): Promise<Result<AttendanceRecord, Error>>
  getLast30AttendanceRecords(employeeId: number): Promise<Result<AttendanceRecord[], Error>>
  generateEmployeeAttendanceReport(
    startDate: Date,
    endDate: Date,
    companyId: number,
    tz: string,
    departmentId?: number
  ): Promise<Result<Buffer, Error>>
}
