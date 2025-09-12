import { PrismaClient, AttendanceRecord as PrismaAttendanceRecord } from '@prisma/client'
import { IAttendanceRecordRepository } from '../interfaces/repositories/IAttendanceRecordRepository.js'
import { AttendanceRecord, CreateAttendanceRecord } from '../types/index.js'

export class AttendanceRecordRepository implements IAttendanceRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(prismaRec: PrismaAttendanceRecord): AttendanceRecord {
    return {
      id: prismaRec.id,
      employeeId: prismaRec.employeeId,
      checkIn: prismaRec.checkIn,
      checkOut: prismaRec.checkOut ?? undefined,
      autoClosed: prismaRec.autoClosed,
    }
  }

  private toPrismaUpdateData(patch: Partial<Omit<AttendanceRecord, 'id'>>): Partial<Omit<AttendanceRecord, 'id'>> {
    const data: Partial<Omit<AttendanceRecord, 'id'>> = {}
    if (patch.employeeId !== undefined) data.employeeId = patch.employeeId
    if (patch.checkIn !== undefined) data.checkIn = patch.checkIn
    if (patch.checkOut !== undefined) data.checkOut = patch.checkOut
    if (patch.autoClosed !== undefined) data.autoClosed = patch.autoClosed
    return data
  }

  async createAttendanceRecord(data: CreateAttendanceRecord): Promise<AttendanceRecord> {
    const ar = await this.prisma.attendanceRecord.create({ data })
    return this.toDomain(ar)
  }

  async getAttendanceRecordById(id: number): Promise<AttendanceRecord | null> {
    const ar = await this.prisma.attendanceRecord.findUnique({ where: { id } })
    return ar ? this.toDomain(ar) : null
  }

  async getAttendanceRecordsByEmployeeId(employeeId: number): Promise<AttendanceRecord[]> {
    const ars = await this.prisma.attendanceRecord.findMany({ where: { employeeId } })
    return ars.map(this.toDomain)
  }

  async getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AttendanceRecord[]> {
    const ars = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        checkIn: { gte: periodStart, lte: periodEnd },
      },
    })
    return ars.map(this.toDomain)
  }

  async getOngoingAttendanceRecord(employeeId: number): Promise<AttendanceRecord | null> {
    const ar = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId, checkOut: null, autoClosed: false },
      orderBy: { checkIn: 'desc' },
    })
    return ar ? this.toDomain(ar) : null
  }

  async updateAttendanceRecord(id: number, patch: Partial<Omit<AttendanceRecord, 'id'>>): Promise<AttendanceRecord> {
    const ar = await this.prisma.attendanceRecord.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(ar)
  }

  async getLast30ByEmployeeId(employeeId: number): Promise<AttendanceRecord[]> {
    const ars = await this.prisma.attendanceRecord.findMany({
      where: { employeeId },
      orderBy: { checkIn: 'desc' },
      take: 30,
    })
    return ars.map(this.toDomain)
  }

  async deleteAttendanceRecord(id: number): Promise<AttendanceRecord> {
    const ar = await this.prisma.attendanceRecord.delete({ where: { id } })
    return this.toDomain(ar)
  }
}
