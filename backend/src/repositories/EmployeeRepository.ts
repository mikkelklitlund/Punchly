import { PrismaClient, Employee as PrismaEmployee, Prisma } from '@prisma/client'
import { Employee, CreateEmployee, AbsenceRecord, EmployeeWithRecords, SimpleEmployee } from '../types/index.js'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'
import { UTCDateMini } from '@date-fns/utc'

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEmployee(data: CreateEmployee): Promise<Employee> {
    const employee = await this.prisma.employee.create({ data })
    return this.toDomain(employee)
  }

  async getEmployeeById(id: number): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({ where: { id } })
    return employee ? this.toDomain(employee) : null
  }

  async getAllEmployees(): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany()
    return employees.map((e) => this.toDomain(e))
  }

  async getActiveEmployeesByCompanyId(companyId: number): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, deletedAt: null },
    })
    return employees.map((e) => this.toDomain(e))
  }

  async getAllEmployeesByCompanyIdAndDepartmentId(companyId: number, departmentId: number): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, departmentId, deletedAt: null },
    })
    return employees.map((e) => this.toDomain(e))
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
          where: { startDate: { lte: todayEnd }, endDate: { gte: todayStart } },
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
          where: { startDate: { lte: todayEnd }, endDate: { gte: todayStart } },
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
    patch: Partial<Omit<Employee, 'id' | 'absenceRecords' | 'attendanceRecords'>>
  ): Promise<Employee> {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: this.toPrismaUpdateData(patch),
    })
    return this.toDomain(employee)
  }

  async softDeleteEmployee(id: number): Promise<Employee> {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new UTCDateMini() },
    })
    return this.toDomain(employee)
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
          include: { absenceType: true },
          orderBy: { startDate: 'asc' },
        },
        department: true,
        employeeType: true,
      },
    })

    return employees.map((emp) => this.toDomainWithRelations(emp))
  }

  // ---------- mapping helpers ----------

  private toDomain(employee: PrismaEmployee): Employee {
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
    }
  }

  private toDomainWithRelations(
    emp: Prisma.EmployeeGetPayload<{
      include: {
        attendanceRecords: true
        absenceRecords: { include: { absenceType: true } }
        department: true
        employeeType: true
      }
    }>
  ): EmployeeWithRecords {
    return {
      ...this.toDomain(emp),
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

  private toPrismaUpdateData(
    patch: Partial<Omit<Employee, 'id' | 'absenceRecords' | 'attendanceRecords'>>
  ): Partial<Omit<Employee, 'id' | 'absenceRecords' | 'attendanceRecords'>> {
    const data: Partial<Omit<Employee, 'id' | 'absenceRecords' | 'attendanceRecords'>> = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.profilePicturePath !== undefined) data.profilePicturePath = patch.profilePicturePath
    if (patch.companyId !== undefined) data.companyId = patch.companyId
    if (patch.departmentId !== undefined) data.departmentId = patch.departmentId
    if (patch.checkedIn !== undefined) data.checkedIn = patch.checkedIn
    if (patch.birthdate !== undefined) data.birthdate = patch.birthdate
    if (patch.employeeTypeId !== undefined) data.employeeTypeId = patch.employeeTypeId
    if (patch.monthlySalary !== undefined) data.monthlySalary = patch.monthlySalary
    if (patch.monthlyHours !== undefined) data.monthlyHours = patch.monthlyHours
    if (patch.hourlySalary !== undefined) data.hourlySalary = patch.hourlySalary
    if (patch.address !== undefined) data.address = patch.address
    if (patch.city !== undefined) data.city = patch.city
    return data
  }
}
