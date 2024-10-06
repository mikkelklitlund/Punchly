import { PrismaClient, Department } from '@prisma/client';

class DepartmentRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async createDepartment(name: string, companyId: number): Promise<Department> {
        return await this.prisma.department.create({
            data: { name, companyId },
        });
    }

    async getDepartmentById(id: number): Promise<Department | null> {
        return await this.prisma.department.findUnique({
            where: { id },
        });
    }

    async getAllDepartments(): Promise<Department[]> {
        return await this.prisma.department.findMany();
    }

    async getAllDepartmentsByCompanyId(companyId: number): Promise<Department[]> {
        return await this.prisma.department.findMany({
            where: { companyId }
        });
    }

    async updateDepartment(id: number, data: Partial<Omit<Department, 'id'>>): Promise<Department> {
        return await this.prisma.department.update({
            where: { id },
            data,
        });
    }

    async deleteDepartment(id: number): Promise<Department> {
        return await this.prisma.department.delete({
            where: { id },
        });
    }
}

export default DepartmentRepository;
