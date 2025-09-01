import { PrismaClient, AbsenceRecord as PrismaAbsenceRecord, AbsenceType as PrismaAbsenceType } from '@prisma/client'
import { CreateAbsenceRecord, AbsenceRecord as AbsenceRecordDTO, AbsenceType as AbsenceTypeDTO } from 'shared'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'

type AbsenceRecordWithType = PrismaAbsenceRecord & { absenceType?: PrismaAbsenceType | null }

export class AbsenceRecordRepository implements IAbsenceRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<AbsenceRecordDTO> {
    const absence = await this.prisma.absenceRecord.create({
      data,
      include: { absenceType: true },
    })
    return this.translateToDTO(absence)
  }

  async getAbsenceRecordById(id: number): Promise<AbsenceRecordDTO | null> {
    const absence = await this.prisma.absenceRecord.findUnique({
      where: { id },
      include: { absenceType: true },
    })
    return absence ? this.translateToDTO(absence) : null
  }

  async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<AbsenceRecordDTO[]> {
    const absences = await this.prisma.absenceRecord.findMany({
      where: { employeeId },
      include: { absenceType: true },
      orderBy: { startDate: 'asc' },
    })
    return absences.map((a) => this.translateToDTO(a))
  }

  async getAbsenceRecordsByEmployeeIdAndRange(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AbsenceRecordDTO[]> {
    const absences = await this.prisma.absenceRecord.findMany({
      where: {
        employeeId,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      include: { absenceType: true },
      orderBy: { startDate: 'asc' },
    })
    return absences.map((a) => this.translateToDTO(a))
  }

  async updateAbsenceRecord(id: number, data: Partial<Omit<PrismaAbsenceRecord, 'id'>>): Promise<AbsenceRecordDTO> {
    const absence = await this.prisma.absenceRecord.update({
      where: { id },
      data,
      include: { absenceType: true },
    })
    return this.translateToDTO(absence)
  }

  async deleteAbsenceRecord(id: number): Promise<AbsenceRecordDTO> {
    const absence = await this.prisma.absenceRecord.delete({
      where: { id },
      include: { absenceType: true },
    })
    return this.translateToDTO(absence)
  }

  private translateToDTO(absenceRecord: AbsenceRecordWithType): AbsenceRecordDTO {
    return {
      id: absenceRecord.id,
      employeeId: absenceRecord.employeeId,
      startDate: absenceRecord.startDate,
      endDate: absenceRecord.endDate,
      absenceTypeId: absenceRecord.absenceTypeId,
      absenceType: absenceRecord.absenceType ? this.translateAbsenceType(absenceRecord.absenceType) : undefined,
    } as AbsenceRecordDTO
  }

  private translateAbsenceType(a: PrismaAbsenceType): AbsenceTypeDTO {
    return {
      id: a.id,
      name: a.name,
      companyId: a.companyId,
    }
  }
}
