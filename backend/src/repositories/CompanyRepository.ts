import { PrismaClient, Company } from '@prisma/client';
import { Company as CompanyDTO } from 'shared';


class CompanyRepository {
    constructor(private readonly prisma: PrismaClient) { }
    async createCompany(data: Omit<Company, 'id'>): Promise<CompanyDTO> {
        const company = await this.prisma.company.create({
            data,
        });

        return this.translateToDTO(company);
    }

    async getCompanyById(id: number): Promise<CompanyDTO | null> {
        const company = await this.prisma.company.findUnique({
            where: { id },
        });

        return company ? this.translateToDTO(company) : null
    }

    async getCompanyByName(name: string): Promise<CompanyDTO | null> {
        const company = await this.prisma.company.findFirst({
            where: { name },
        });

        return company ? this.translateToDTO(company) : null
    }

    async getAllCompanies(): Promise<CompanyDTO[]> {
        const companies = await this.prisma.company.findMany();
        return companies.map(this.translateToDTO)
    }

    async updateCompany(id: number, data: Partial<Omit<Company, 'id'>>): Promise<CompanyDTO> {
        const company = await this.prisma.company.update({
            where: { id },
            data,
        });

        return this.translateToDTO(company)
    }

    async deleteCompany(id: number): Promise<Company> {
        const company = await this.prisma.company.delete({
            where: { id },
        });

        return this.translateToDTO(company)
    }

    private translateToDTO(company: Company): CompanyDTO {
        return {
            id: company.id,
            address: company.address,
            name: company.name
        }
    }
}

export default CompanyRepository;
