import { PrismaClient, AttendanceRecord } from '@prisma/client';


class AttendanceRecordRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async createAttendanceRecord(employeeId: number, date: Date, checkIn: Date, checkOut?: Date): Promise<AttendanceRecord> {
        return await this.prisma.attendanceRecord.create({
            data: { employeeId, date, checkIn, checkOut },
        });
    }

    async getAttendanceRecordById(id: number): Promise<AttendanceRecord | null> {
        return await this.prisma.attendanceRecord.findUnique({
            where: { id },
        });
    }

    async getAttendanceRecordsByEmployeeId(employeeId: number): Promise<AttendanceRecord[]> {
        return await this.prisma.attendanceRecord.findMany({
            where: { employeeId },
        });
    }

    async getAttendanceRecordsByEmployeeIdAndMonth(employeeId: number, monthStart: Date, monthEnd: Date): Promise<AttendanceRecord[]> {
        return await this.prisma.attendanceRecord.findMany({
            where: {
                employeeId,
                date: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });
    }

    async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
        return await this.prisma.attendanceRecord.findMany();
    }

    async updateAttendanceRecord(id: number, data: Partial<Omit<AttendanceRecord, 'id'>>): Promise<AttendanceRecord> {
        return await this.prisma.attendanceRecord.update({
            where: { id },
            data,
        });
    }

    async deleteAttendanceRecord(id: number): Promise<AttendanceRecord> {
        return await this.prisma.attendanceRecord.delete({
            where: { id },
        });
    }
}

export default AttendanceRecordRepository;
