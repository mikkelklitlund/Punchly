import { CreateAbsenceRecord, AbsenceRecord } from 'shared'
import { Result } from 'src/utils/Result'

export interface IAbsenceService {
  createAbsenceRecord(newAbsence: CreateAbsenceRecord): Promise<Result<AbsenceRecord, Error>>
  getAbsenceRecordById(id: number): Promise<Result<AbsenceRecord, Error>>
  getAbsenceRecordsByEmployeeId(employeeId: number): Promise<Result<AbsenceRecord[], Error>>
  getAbsenceRecordsByEmployeeIdAndRange(
    employeeId: number,
    start: Date,
    end: Date
  ): Promise<Result<AbsenceRecord[], Error>>
  updateAbsenceRecord(id: number, data: Partial<CreateAbsenceRecord>): Promise<Result<AbsenceRecord, Error>>
  deleteAbsenceRecord(id: number): Promise<Result<AbsenceRecord, Error>>
}
