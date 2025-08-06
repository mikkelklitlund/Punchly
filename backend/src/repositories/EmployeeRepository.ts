import { PrismaClient, Employee, Prisma } from '@prisma/client'
import {
  Employee as DTOEmployee,
  CreateEmployee,
  AttendanceRecord,
  AbsenceRecord,
  Department,
  EmployeeType,
  AbsenceType,
  EmployeeWithRecords,
} from 'shared'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEmployee(data: CreateEmployee): Promise<DTOEmployee> {
    const employee = await this.prisma.employee.create({
      data,
    })

    return this.translateToDto(employee)
  }

  async getEmployeeById(id: number): Promise<DTOEmployee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    })

    return employee ? this.translateToDto(employee) : null
  }

  async getAllEmployees(): Promise<DTOEmployee[]> {
    const employees = await this.prisma.employee.findMany()
    return employees.map(this.translateToDto)
  }

  async getActiveEmployeesByCompanyId(companyId: number): Promise<DTOEmployee[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId: companyId,
        deletedAt: null,
      },
    })

    return employees.map(this.translateToDto)
  }

  async getAllEmployeesByCompanyIdAndDepartmentId(companyId: number, departmentId: number): Promise<DTOEmployee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, departmentId, deletedAt: null },
    })

    return employees.map(this.translateToDto)
  }

  async updateEmployee(
    id: number,
    data: Partial<Omit<DTOEmployee, 'id' | 'absenceRecords' | 'attendanceRecords'>>
  ): Promise<DTOEmployee> {
    const employee = await this.prisma.employee.update({
      where: { id },
      data,
    })

    return this.translateToDto(employee)
  }

  async softDeleteEmployee(id: number): Promise<DTOEmployee> {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return this.translateToDto(employee)
  }

  async getEmployeesWithAttendanceAndAbsences(
    startDate: Date,
    endDate: Date,
    companyId: number,
    departmentId?: number
  ): Promise<EmployeeWithRecords[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        ...(departmentId && { departmentId }),
        OR: [
          { attendanceRecords: { some: { checkIn: { gte: startDate, lte: endDate } } } },
          {
            absenceRecords: {
              some: {
                OR: [
                  { startDate: { gte: startDate, lte: endDate } },
                  { endDate: { gte: startDate, lte: endDate } },
                  { startDate: { lte: startDate }, endDate: { gte: endDate } },
                ],
              },
            },
          },
        ],
      },
      include: {
        attendanceRecords: {
          where: { checkIn: { gte: startDate, lte: endDate } },
          orderBy: { checkIn: 'asc' },
        },
        absenceRecords: {
          where: {
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { endDate: { gte: startDate, lte: endDate } },
              { startDate: { lte: startDate }, endDate: { gte: endDate } },
            ],
          },
          orderBy: { startDate: 'asc' },
        },
        department: true,
        employeeType: true,
      },
    })

    return employees.map((emp) => this.translateToFullDto(emp))
  }

  private translateToDto(employee: Employee): DTOEmployee {
    return {
      id: employee.id,
      name: employee.name,
      profilePicturePath: employee.profilePicturePath,
      companyId: employee.companyId,
      departmentId: employee.departmentId,
      checkedIn: employee.checkedIn,
      birthdate: employee.birthdate,
      employeeTypeId: employee.employeeTypeId,
      monthlySalary: employee.monthlySalary ?? undefined,
      monthlyHours: employee.monthlyHours ?? undefined,
      hourlySalary: employee.hourlySalary ?? undefined,
      address: employee.address,
      city: employee.city,
      absenceRecords: undefined,
      attendanceRecords: undefined,
    }
  }

  private translateToFullDto(
    emp: Prisma.EmployeeGetPayload<{
      include: {
        attendanceRecords: true
        absenceRecords: true
        department: true
        employeeType: true
      }
    }>
  ): DTOEmployee & {
    attendanceRecords: AttendanceRecord[]
    absenceRecords: AbsenceRecord[]
    department: Department
    employeeType: EmployeeType
  } {
    return {
      ...this.translateToDto(emp),
      attendanceRecords: emp.attendanceRecords.map((record) => ({
        id: record.id,
        employeeId: record.employeeId,
        checkIn: record.checkIn,
        checkOut: record.checkOut ?? undefined,
        autoClosed: record.autoClosed,
      })),
      absenceRecords: emp.absenceRecords.map((absence) => ({
        id: absence.id,
        employeeId: absence.employeeId,
        startDate: absence.startDate,
        endDate: absence.endDate,
        absenceType: absence.absenceType as AbsenceType,
      })),
      department: {
        id: emp.department.id,
        name: emp.department.name,
        companyId: emp.department.companyId,
      },
      employeeType: {
        id: emp.employeeType.id,
        name: emp.employeeType.name,
        companyId: emp.employeeType.companyId,
      },
    }
  }
}
