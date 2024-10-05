import { PrismaClient, Employee } from '@prisma/client';

const prisma = new PrismaClient();

class EmployeeRepository {
    async createEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
        return await prisma.employee.create({
            data,
        });
    }

    async getEmployeeById(id: number): Promise<Employee | null> {
        return await prisma.employee.findUnique({
            where: { id },
        });
    }

    async getAllEmployees(): Promise<Employee[]> {
        return await prisma.employee.findMany();
    }

    async getActiveEmployeesByCompanyId(companyId: number): Promise<Employee[]> {
        return await prisma.employee.findMany({
            where: {
                companyId,
                deletedAt: null,
            },
        });
    }

    async getAllEmployeesByCompanyIdAndDepartmentId(companyId: number, departmentId: number): Promise<Employee[]> {
        return await prisma.employee.findMany({
            where: { companyId, departmentId, deletedAt: null },
        });
    }

    async updateEmployee(id: number, data: Partial<Omit<Employee, 'id'>>): Promise<Employee> {
        return await prisma.employee.update({
            where: { id },
            data,
        });
    }

    async softDeleteEmployee(id: number): Promise<Employee> {
        return await prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

export default new EmployeeRepository();
