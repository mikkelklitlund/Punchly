import { PrismaClient, Company } from '@prisma/client';

const prisma = new PrismaClient();

class CompanyRepository {
    async createCompany(data: Omit<Company, 'id'>): Promise<Company> {
        return await prisma.company.create({
            data,
        });
    }

    async getCompanyById(id: number): Promise<Company | null> {
        return await prisma.company.findUnique({
            where: { id },
        });
    }

    async getCompanyByName(name: string): Promise<Company | null> {
        return await prisma.company.findFirst({
            where: { name },
        });
    }

    async getAllCompanies(): Promise<Company[]> {
        return await prisma.company.findMany();
    }

    async updateCompany(id: number, data: Partial<Omit<Company, 'id'>>): Promise<Company> {
        return await prisma.company.update({
            where: { id },
            data,
        });
    }

    async deleteCompany(id: number): Promise<Company> {
        return await prisma.company.delete({
            where: { id },
        });
    }
}

export default new CompanyRepository();
