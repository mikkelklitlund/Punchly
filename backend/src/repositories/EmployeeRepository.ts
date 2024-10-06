import { PrismaClient, Employee } from '@prisma/client';
import { Employee as DTOEmployee, CreateEmployee } from 'shared';

class EmployeeRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async createEmployee(data: CreateEmployee): Promise<DTOEmployee> {
        const employee = await this.prisma.employee.create({
            data,
        });

        return this.translateToDto(employee);
    }

    async getEmployeeById(id: number): Promise<DTOEmployee | null> {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
        });

        return employee ? this.translateToDto(employee) : null;
    }

    async getAllEmployees(): Promise<DTOEmployee[]> {
        const employees = await this.prisma.employee.findMany();
        return employees.map(this.translateToDto);
    }

    async getActiveEmployeesByCompanyId(companyId: number): Promise<DTOEmployee[]> {
        const employees = await this.prisma.employee.findMany({
            where: {
                companyId,
                deletedAt: null,
            },
        });

        return employees.map(this.translateToDto);
    }

    async getAllEmployeesByCompanyIdAndDepartmentId(companyId: number, departmentId: number): Promise<DTOEmployee[]> {
        const employees = await this.prisma.employee.findMany({
            where: { companyId, departmentId, deletedAt: null },
        });

        return employees.map(this.translateToDto);
    }

    async updateEmployee(id: number, data: Partial<Omit<DTOEmployee, 'id' | 'absenceRecords' | 'attendanceRecords'>>): Promise<DTOEmployee> {
        const employee = await this.prisma.employee.update({
            where: { id },
            data,
        });

        return this.translateToDto(employee);
    }

    async softDeleteEmployee(id: number): Promise<DTOEmployee> {
        const employee = await this.prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return this.translateToDto(employee);
    }

    private translateToDto(employee: Employee): DTOEmployee {
        return {
            id: employee.id,
            name: employee.name,
            profilePicturePath: employee.profilePicturePath,
            companyId: employee.companyId,
            departmentId: employee.departmentId,
            checkedIn: employee.checkedIn,
            birthday: employee.birthday,
            employeeTypeId: employee.employeeTypeId,
            monthlySalary: employee.monthlySalary ?? undefined,
            hourlySalary: employee.hourlySalary ?? undefined,
            address: employee.address,
            city: employee.city,
            absenceRecords: undefined,
            attendanceRecords: undefined,
        };
    }
}

export default EmployeeRepository;
