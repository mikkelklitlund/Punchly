import { CreateAttendanceRecord, AttendanceRecord } from 'shared'
import { Result } from 'src/utils/Result'

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
}
