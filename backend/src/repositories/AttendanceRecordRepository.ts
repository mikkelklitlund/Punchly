import { PrismaClient, AttendanceRecord } from '@prisma/client';

const prisma = new PrismaClient();

class AttendanceRecordRepository {
    async createAttendanceRecord(employeeId: number, date: Date, checkIn: Date, checkOut?: Date): Promise<AttendanceRecord> {
        return await prisma.attendanceRecord.create({
            data: { employeeId, date, checkIn, checkOut },
        });
    }

    async getAttendanceRecordById(id: number): Promise<AttendanceRecord | null> {
        return await prisma.attendanceRecord.findUnique({
            where: { id },
        });
    }

    async getAttendanceRecordsByEmployeeId(employeeId: number): Promise<AttendanceRecord[]> {
        return await prisma.attendanceRecord.findMany({
            where: { employeeId },
        });
    }

    async getAttendanceRecordsByEmployeeIdAndMonth(employeeId: number, monthStart: Date, monthEnd: Date): Promise<AttendanceRecord[]> {
        return await prisma.attendanceRecord.findMany({
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
        return await prisma.attendanceRecord.findMany();
    }

    async updateAttendanceRecord(id: number, data: Partial<Omit<AttendanceRecord, 'id'>>): Promise<AttendanceRecord> {
        return await prisma.attendanceRecord.update({
            where: { id },
            data,
        });
    }

    async deleteAttendanceRecord(id: number): Promise<AttendanceRecord> {
        return await prisma.attendanceRecord.delete({
            where: { id },
        });
    }
}

export default new AttendanceRecordRepository();
