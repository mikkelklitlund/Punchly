import { PrismaClient, AbsenceRecord, AbsenceType } from '@prisma/client';

const prisma = new PrismaClient();

class AbsenceRecordRepository {
    async createAbsenceRecord(employeeId: number, startDate: Date, endDate: Date, absenceType: AbsenceType): Promise<AbsenceRecord> {
        return await prisma.absenceRecord.create({
            data: { employeeId, startDate, endDate, absenceType },
        });
    }

    async getAbsenceRecordById(id: number): Promise<AbsenceRecord | null> {
        return await prisma.absenceRecord.findUnique({
            where: { id },
        });
    }

    async getAllAbsenceRecords(): Promise<AbsenceRecord[]> {
        return await prisma.absenceRecord.findMany();
    }

    async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<AbsenceRecord[]> {
        return await prisma.absenceRecord.findMany({
            where: { employeeId },
        });
    }

    async getAbsenceRecordsByEmployeeIdAndMonth(employeeId: number, monthStart: Date, monthEnd: Date): Promise<AbsenceRecord[]> {
        return await prisma.absenceRecord.findMany({
            where: {
                employeeId,
                AND: [
                    {
                        startDate: {
                            lte: monthEnd,
                        },
                    },
                    {
                        endDate: {
                            gte: monthStart,
                        },
                    },
                ],
            },
        });
    }

    async updateAbsenceRecord(id: number, data: Partial<Omit<AbsenceRecord, 'id'>>): Promise<AbsenceRecord> {
        return await prisma.absenceRecord.update({
            where: { id },
            data,
        });
    }

    async deleteAbsenceRecord(id: number): Promise<AbsenceRecord> {
        return await prisma.absenceRecord.delete({
            where: { id },
        });
    }
}

export default new AbsenceRecordRepository();
