import { PrismaClient, Company } from '@prisma/client';


class CompanyRepository {
    constructor(private readonly prisma: PrismaClient) { }
    async createCompany(data: Omit<Company, 'id'>): Promise<Company> {
        return await this.prisma.company.create({
            data,
        });
    }

    async getCompanyById(id: number): Promise<Company | null> {
        return await this.prisma.company.findUnique({
            where: { id },
        });
    }

    async getCompanyByName(name: string): Promise<Company | null> {
        return await this.prisma.company.findFirst({
            where: { name },
        });
    }

    async getAllCompanies(): Promise<Company[]> {
        return await this.prisma.company.findMany();
    }

    async updateCompany(id: number, data: Partial<Omit<Company, 'id'>>): Promise<Company> {
        return await this.prisma.company.update({
            where: { id },
            data,
        });
    }

    async deleteCompany(id: number): Promise<Company> {
        return await this.prisma.company.delete({
            where: { id },
        });
    }
}

export default CompanyRepository;
