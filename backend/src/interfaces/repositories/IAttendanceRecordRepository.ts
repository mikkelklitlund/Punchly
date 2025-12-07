import { AttendanceRecord, CreateAttendanceRecord } from '../../types/index.js'

export interface IAttendanceRecordRepository {
  createAttendanceRecord(data: CreateAttendanceRecord): Promise<AttendanceRecord>
  getAttendanceRecordById(id: number): Promise<AttendanceRecord | null>
  getAttendanceRecordsByEmployeeId(employeeId: number): Promise<AttendanceRecord[]>
  getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AttendanceRecord[]>
  getOngoingAttendanceRecord(employeeId: number): Promise<AttendanceRecord | null>
  updateAttendanceRecord(id: number, data: Partial<Omit<AttendanceRecord, 'id'>>): Promise<AttendanceRecord>
  deleteAttendanceRecord(id: number): Promise<AttendanceRecord>
  getLast30ByEmployeeId(employeeId: number): Promise<AttendanceRecord[]>
  getRecordsByCompanyIdAndDateRange(companyId: number, dayStart: Date, dayEnd: Date): Promise<AttendanceRecord[]>
}
