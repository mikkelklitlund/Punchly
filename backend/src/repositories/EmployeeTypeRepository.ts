import { PrismaClient, EmployeeType } from '@prisma/client';

const prisma = new PrismaClient();

class EmployeeTypeRepository {
    async createEmployeeType(name: string, companyId: number): Promise<EmployeeType> {
        return await prisma.employeeType.create({
            data: { name, companyId },
        });
    }

    async getEmployeeTypeById(id: number): Promise<EmployeeType | null> {
        return await prisma.employeeType.findUnique({
            where: { id },
        });
    }

    async getEmployeeTypeByCompanyId(companyId: number): Promise<EmployeeType[]> {
        return await prisma.employeeType.findMany({
            where: { companyId },
        });
    }

    async getAllEmployeeTypes(): Promise<EmployeeType[]> {
        return await prisma.employeeType.findMany();
    }

    async updateEmployeeType(id: number, data: Partial<Omit<EmployeeType, 'id'>>): Promise<EmployeeType> {
        return await prisma.employeeType.update({
            where: { id },
            data,
        });
    }

    async deleteEmployeeType(id: number): Promise<EmployeeType> {
        return await prisma.employeeType.delete({
            where: { id },
        });
    }
}

export default new EmployeeTypeRepository();
