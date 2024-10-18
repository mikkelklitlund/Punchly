import { AbsenceRecord, CreateAbsenceRecord } from 'shared'

export interface IAbsenceRecordRepository {
  createAbsenceRecord(data: CreateAbsenceRecord): Promise<AbsenceRecord>
  getAbsenceRecordById(id: number): Promise<AbsenceRecord | null>
  getAbsenceRecordsByEmployeeId(employeeId: number): Promise<AbsenceRecord[]>
  getAbsenceRecordsByEmployeeIdAndRange(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AbsenceRecord[]>
  updateAbsenceRecord(id: number, data: Partial<Omit<AbsenceRecord, 'id'>>): Promise<AbsenceRecord>
  deleteAbsenceRecord(id: number): Promise<AbsenceRecord>
}
