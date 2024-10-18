import { PrismaClient, AttendanceRecord } from '@prisma/client'
import { CreateAttendanceRecord, AttendanceRecord as DTOAttendanceRecord } from 'shared'

class AttendanceRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAttendanceRecord(data: CreateAttendanceRecord): Promise<DTOAttendanceRecord> {
    const ar = await this.prisma.attendanceRecord.create({
      data,
    })

    return this.translateToDto(ar)
  }

  async getAttendanceRecordById(id: number): Promise<DTOAttendanceRecord | null> {
    const ar = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    })

    return ar ? this.translateToDto(ar) : null
  }

  async getAttendanceRecordsByEmployeeId(employeeId: number): Promise<DTOAttendanceRecord[]> {
    const ars = await this.prisma.attendanceRecord.findMany({
      where: { employeeId },
    })

    return ars.map(this.translateToDto)
  }

  async getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DTOAttendanceRecord[]> {
    const ars = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        checkIn: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    return ars.map(this.translateToDto)
  }

  async getOngoingAttendanceRecord(employeeId: number): Promise<AttendanceRecord | null> {
    return await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        checkOut: null,
      },
    })
  }

  async updateAttendanceRecord(id: number, data: Partial<Omit<AttendanceRecord, 'id'>>): Promise<DTOAttendanceRecord> {
    const ar = await this.prisma.attendanceRecord.update({
      where: { id },
      data,
    })

    return this.translateToDto(ar)
  }

  async deleteAttendanceRecord(id: number): Promise<DTOAttendanceRecord> {
    const ar = await this.prisma.attendanceRecord.delete({
      where: { id },
    })

    return this.translateToDto(ar)
  }

  private translateToDto(attendance: AttendanceRecord): DTOAttendanceRecord {
    return {
      id: attendance.id,
      employeeId: attendance.employeeId,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut ? attendance.checkOut : undefined,
    }
  }
}

export default AttendanceRecordRepository
