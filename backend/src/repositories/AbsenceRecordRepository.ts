import { PrismaClient, AbsenceRecord, AbsenceType } from '@prisma/client';


class AbsenceRecordRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async createAbsenceRecord(employeeId: number, startDate: Date, endDate: Date, absenceType: AbsenceType): Promise<AbsenceRecord> {
        return await this.prisma.absenceRecord.create({
            data: { employeeId, startDate, endDate, absenceType },
        });
    }

    async getAbsenceRecordById(id: number): Promise<AbsenceRecord | null> {
        return await this.prisma.absenceRecord.findUnique({
            where: { id },
        });
    }

    async getAllAbsenceRecords(): Promise<AbsenceRecord[]> {
        return await this.prisma.absenceRecord.findMany();
    }

    async getAbsenceRecordsByEmployeeId(employeeId: number): Promise<AbsenceRecord[]> {
        return await this.prisma.absenceRecord.findMany({
            where: { employeeId },
        });
    }

    async getAbsenceRecordsByEmployeeIdAndMonth(employeeId: number, monthStart: Date, monthEnd: Date): Promise<AbsenceRecord[]> {
        return await this.prisma.absenceRecord.findMany({
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
        return await this.prisma.absenceRecord.update({
            where: { id },
            data,
        });
    }

    async deleteAbsenceRecord(id: number): Promise<AbsenceRecord> {
        return await this.prisma.absenceRecord.delete({
            where: { id },
        });
    }
}

export default AbsenceRecordRepository;
