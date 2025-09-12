import { AbsenceType } from '../../types/index.js'
import { Result } from '../../utils/Result.js'

export interface IAbsenceTypeService {
  createAbsenceType(typeName: string, companyId: number): Promise<Result<AbsenceType, Error>>
  getAbsenceTypesByCompanyId(companyId: number): Promise<Result<AbsenceType[], Error>>
  deleteAbsenceTypeFromCompany(companyId: number, typeName: string): Promise<Result<AbsenceType, Error>>
  deleteAbsenceType(absenceTypeId: number): Promise<Result<AbsenceType, Error>>
  renameAbsenceType(absenceTypeId: number, newName: string): Promise<Result<AbsenceType, Error>>
}
