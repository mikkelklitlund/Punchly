import { PrismaClient, AbsenceRecord as PrismaAbsenceRecord, AbsenceType as PrismaAbsenceType } from '@prisma/client'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { CreateAbsenceRecord, AbsenceRecord } from '../types/index.js'

type PrismaAbsenceRecordWithType = PrismaAbsenceRecord & { absenceType: PrismaAbsenceType }

export class AbsenceRecordRepository implements IAbsenceRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaRec: PrismaAbsenceRecordWithType): AbsenceRecord {
    return {
      id: prismaRec.id,
      employeeId: prismaRec.employeeId,
      startDate: prismaRec.startDate,
      endDate: prismaRec.endDate,
      absenceTypeId: prismaRec.absenceTypeId,
      absenceType: {
        id: prismaRec.absenceType.id,
        name: prismaRec.absenceType.name,
        companyId: prismaRec.absenceType.companyId,
      },
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<AbsenceRecord, 'id' | 'absenceType'>>) {
    const data: Partial<Omit<AbsenceRecord, 'id' | 'absenceType'>> = {}

    if (patch.employeeId !== undefined) {
      data.employeeId = patch.employeeId
    }
    if (patch.startDate !== undefined) {
      data.startDate = patch.startDate
    }
    if (patch.endDate !== undefined) {
      data.endDate = patch.endDate
    }
    if (patch.absenceTypeId !== undefined) {
      data.absenceTypeId = patch.absenceTypeId
    }

    return data
  }

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<AbsenceRecord> {
    const absence = await this.prisma.absenceRecord.create({
      data,
      include: { absenceType: true },
    })
    return this.toDomain(absence)
  }

  async getAbsenceRecordById(id: number): Promise<AbsenceRecord | null> {
    const absence = await this.prisma.absenceRecord.findUnique({
      where: { id },
      include: { absenceType: true },
    })
    return absence ? this.toDomain(absence) : null
  }

  async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<AbsenceRecord[]> {
    const absences = await this.prisma.absenceRecord.findMany({
      where: { employeeId },
      include: { absenceType: true },
      orderBy: { startDate: 'asc' },
    })
    return absences.map(this.toDomain)
  }

  async getAbsenceRecordsByEmployeeIdAndRange(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AbsenceRecord[]> {
    const absences = await this.prisma.absenceRecord.findMany({
      where: {
        employeeId,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      include: { absenceType: true },
      orderBy: { startDate: 'asc' },
    })
    return absences.map(this.toDomain)
  }

  async updateAbsenceRecord(id: number, patch: Partial<Omit<AbsenceRecord, 'id'>>): Promise<AbsenceRecord> {
    const absence = await this.prisma.absenceRecord.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
      include: { absenceType: true },
    })
    return this.toDomain(absence)
  }

  async deleteAbsenceRecord(id: number): Promise<AbsenceRecord> {
    const absence = await this.prisma.absenceRecord.delete({
      where: { id },
      include: { absenceType: true },
    })
    return this.toDomain(absence)
  }
}
