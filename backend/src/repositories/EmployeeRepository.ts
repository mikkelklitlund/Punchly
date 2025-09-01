import { PrismaClient, Employee, Prisma } from '@prisma/client'
import {
  Employee as DTOEmployee,
  CreateEmployee,
  AttendanceRecord,
  AbsenceRecord,
  Department,
  EmployeeType,
  EmployeeWithRecords,
  SimpleEmployee,
} from 'shared'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEmployee(data: CreateEmployee): Promise<DTOEmployee> {
    const employee = await this.prisma.employee.create({ data })
    return this.translateToDto(employee)
  }

  async getEmployeeById(id: number): Promise<DTOEmployee | null> {
    const employee = await this.prisma.employee.findUnique({ where: { id } })
    return employee ? this.translateToDto(employee) : null
  }

  async getAllEmployees(): Promise<DTOEmployee[]> {
    const employees = await this.prisma.employee.findMany()
    return employees.map(this.translateToDto)
  }

  async getActiveEmployeesByCompanyId(companyId: number): Promise<DTOEmployee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, deletedAt: null },
    })
    return employees.map(this.translateToDto)
  }

  async getAllEmployeesByCompanyIdAndDepartmentId(companyId: number, departmentId: number): Promise<DTOEmployee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, departmentId, deletedAt: null },
    })
    return employees.map(this.translateToDto)
  }

  async getSimpleEmployeesByCompanyIdWithTodayAbsence(
    companyId: number,
    todayStart: Date,
    todayEnd: Date
  ): Promise<SimpleEmployee[]> {
    const rows = await this.prisma.employee.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        profilePicturePath: true,
        companyId: true,
        departmentId: true,
        checkedIn: true,
        absenceRecords: {
          where: {
            startDate: { lte: todayEnd },
            endDate: { gte: todayStart },
          },
          include: { absenceType: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ departmentId: 'asc' }, { name: 'asc' }],
    })

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      profilePicturePath: r.profilePicturePath,
      companyId: r.companyId,
      departmentId: r.departmentId,
      checkedIn: r.checkedIn,
      absence: r.absenceRecords[0] ? this.mapAbsenceRecordLite(r.absenceRecords[0]) : undefined,
    }))
  }

  async getSimpleEmployeesByCompanyAndDepartmentWithTodayAbsence(
    companyId: number,
    departmentId: number,
    todayStart: Date,
    todayEnd: Date
  ): Promise<SimpleEmployee[]> {
    const rows = await this.prisma.employee.findMany({
      where: { companyId, departmentId, deletedAt: null },
      select: {
        id: true,
        name: true,
        profilePicturePath: true,
        companyId: true,
        departmentId: true,
        checkedIn: true,
        absenceRecords: {
          where: {
            startDate: { lte: todayEnd },
            endDate: { gte: todayStart },
          },
          include: { absenceType: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ name: 'asc' }],
    })

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      profilePicturePath: r.profilePicturePath,
      companyId: r.companyId,
      departmentId: r.departmentId,
      checkedIn: r.checkedIn,
      absence: r.absenceRecords[0] ? this.mapAbsenceRecordLite(r.absenceRecords[0]) : undefined,
    }))
  }

  async updateEmployee(
    id: number,
    data: Partial<Omit<DTOEmployee, 'id' | 'absenceRecords' | 'attendanceRecords'>>
  ): Promise<DTOEmployee> {
    const employee = await this.prisma.employee.update({ where: { id }, data })
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
          include: { absenceType: true }, // <— include model relation
          orderBy: { startDate: 'asc' },
        },
        department: true,
        employeeType: true,
      },
    })

    return employees.map((emp) => this.translateToFullDto(emp))
  }

  // ---------- mapping helpers ----------

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
        absenceRecords: { include: { absenceType: true } }
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
      absenceRecords: emp.absenceRecords.map((a) => this.mapAbsenceRecordLite(a)),
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

  private mapAbsenceRecordLite(a: {
    id: number
    employeeId: number
    startDate: Date
    endDate: Date
    absenceTypeId: number
    absenceType: { id: number; name: string; companyId: number }
  }): AbsenceRecord {
    return {
      id: a.id,
      employeeId: a.employeeId,
      startDate: a.startDate,
      endDate: a.endDate,
      absenceTypeId: a.absenceTypeId,
      absenceType: {
        id: a.absenceType.id,
        name: a.absenceType.name,
        companyId: a.absenceType.companyId,
      },
    }
  }
}
