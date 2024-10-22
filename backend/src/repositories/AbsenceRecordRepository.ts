import { PrismaClient, AbsenceRecord, AbsenceType as PrismaAbsenceType } from '@prisma/client'
import { CreateAbsenceRecord, AbsenceRecord as AbsenceRecordDTO, AbsenceType } from 'shared'
import { IAbsenceRecordRepository } from 'src/interfaces/repositories/IAbsenceRecordRepository'

export class AbsenceRecordRepository implements IAbsenceRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAbsenceRecord(data: CreateAbsenceRecord): Promise<AbsenceRecordDTO> {
    const absence = await this.prisma.absenceRecord.create({
      data,
    })

    return this.translateToDTO(absence)
  }

  async getAbsenceRecordById(id: number): Promise<AbsenceRecordDTO | null> {
    const absence = await this.prisma.absenceRecord.findUnique({
      where: { id },
    })

    return absence ? this.translateToDTO(absence) : null
  }

  async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<AbsenceRecordDTO[]> {
    const absences = await this.prisma.absenceRecord.findMany({
      where: { employeeId },
    })

    return absences.map(this.translateToDTO)
  }

  async getAbsenceRecordsByEmployeeIdAndRange(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AbsenceRecordDTO[]> {
    const absences = await this.prisma.absenceRecord.findMany({
      where: {
        employeeId,
        AND: [
          {
            startDate: {
              lte: periodEnd,
            },
          },
          {
            endDate: {
              gte: periodStart,
            },
          },
        ],
      },
    })

    return absences.map(this.translateToDTO)
  }

  async updateAbsenceRecord(id: number, data: Partial<Omit<AbsenceRecord, 'id'>>): Promise<AbsenceRecordDTO> {
    const absence = await this.prisma.absenceRecord.update({
      where: { id },
      data,
    })

    return this.translateToDTO(absence)
  }

  async deleteAbsenceRecord(id: number): Promise<AbsenceRecordDTO> {
    const absence = await this.prisma.absenceRecord.delete({
      where: { id },
    })

    return this.translateToDTO(absence)
  }

  private translateToDTO(absenceRecord: AbsenceRecord): AbsenceRecordDTO {
    return {
      id: absenceRecord.id,
      employeeId: absenceRecord.employeeId,
      startDate: absenceRecord.startDate,
      endDate: absenceRecord.endDate,
      absenceType: this.mapAbsenceType(absenceRecord.absenceType),
    }
  }

  private mapAbsenceType(absenceType: PrismaAbsenceType): AbsenceType {
    switch (absenceType) {
      case 'VACATION':
        return AbsenceType.VACATION
      case 'SICK':
        return AbsenceType.SICK
      case 'HOMEDAY':
        return AbsenceType.HOMEDAY
      case 'PUBLIC_HOLIDAY':
        return AbsenceType.PUBLIC_HOLIDAY
      default:
        throw new Error('Unknown absence type')
    }
  }
}
