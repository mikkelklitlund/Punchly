import { AbsenceType } from '../../types/index.js'

export interface IAbsenceTypeRepository {
  createAbsenceType(name: string, companyId: number): Promise<AbsenceType>
  getAbsenceTypeById(id: number): Promise<AbsenceType | null>
  getAbsenceTypesByCompanyId(companyId: number): Promise<AbsenceType[]>
  absenceTypeExistsOnCompanyId(companyId: number, name: string): Promise<boolean>
  updateAbsenceType(id: number, data: Partial<Omit<AbsenceType, 'id'>>): Promise<AbsenceType>
  deleteAbsenceType(id: number): Promise<AbsenceType>
  deleteAbsenceTypeByCompanyIdAndName(companyId: number, name: string): Promise<AbsenceType>
}
