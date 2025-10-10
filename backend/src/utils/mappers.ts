import { UTCDateMini } from '@date-fns/utc'
import {
  Company,
  Employee,
  SimpleEmployee,
  Department,
  EmployeeType,
  AbsenceType,
  User,
  AbsenceRecord,
  AttendanceRecord,
  CreateEmployee,
} from '../types/index.js'
import {
  CompanyDTO,
  EmployeeDTO,
  SimpleEmployeeDTO,
  DepartmentDTO,
  EmployeeTypeDTO,
  AbsenceTypeDTO,
  UserDTO,
  AbsenceRecordDTO,
  AttendanceRecordDTO,
  CreateEmployeeDTO,
} from 'shared'

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function fromCompanyDTO(dto: { name: string; address: string }): Omit<Company, 'id'> {
  return {
    name: dto.name.trim(),
    address: dto.address.trim(),
  }
}

export function toCompanyDTO(company: Company): CompanyDTO {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
  }
}

export function toEmployeeDTO(emp: Employee): EmployeeDTO {
  return {
    id: emp.id,
    name: emp.name,
    birthdate: toDateOnly(emp.birthdate),
    address: emp.address,
    departmentId: emp.departmentId,
    employeeTypeId: emp.employeeTypeId,
    companyId: emp.companyId,
    profilePicturePath: emp.profilePicturePath ?? null,
    monthlySalary: emp.monthlySalary ?? null,
    hourlySalary: emp.hourlySalary ?? null,
    monthlyHours: emp.monthlyHours ?? null,
    checkedIn: emp.checkedIn,
    city: emp.city,
    absenceRecords: emp.absenceRecords?.map(toAbsenceRecordDTO) ?? [],
    attendanceRecords: emp.attendanceRecords?.map(toAttendanceRecordDTO) ?? [],
  }
}

export function fromPartialEmployeeDTO(emp: Partial<EmployeeDTO>): Partial<Omit<Employee, 'id'>> {
  const result: Partial<Omit<Employee, 'id'>> = {}

  if (emp.name) result.name = emp.name.trim()
  if (emp.address) result.address = emp.address.trim()
  if (emp.city) result.city = emp.city.trim()
  if (emp.companyId) result.companyId = emp.companyId
  if (emp.departmentId) result.departmentId = emp.departmentId
  if (emp.employeeTypeId) result.employeeTypeId = emp.employeeTypeId
  if (emp.checkedIn) result.checkedIn = emp.checkedIn

  if (emp.profilePicturePath) {
    result.profilePicturePath = emp.profilePicturePath
  }

  if (emp.monthlySalary) result.monthlySalary = emp.monthlySalary
  if (emp.hourlySalary) result.hourlySalary = emp.hourlySalary
  if (emp.monthlyHours) result.monthlyHours = emp.monthlyHours

  if (emp.birthdate) {
    result.birthdate = new UTCDateMini(emp.birthdate)
  }

  return result
}

export function fromEmployeeDTO(emp: EmployeeDTO): Employee {
  return {
    id: emp.id,
    name: emp.name,
    birthdate: new UTCDateMini(emp.birthdate),
    address: emp.address,
    departmentId: emp.departmentId,
    employeeTypeId: emp.employeeTypeId,
    companyId: emp.companyId,
    profilePicturePath: emp.profilePicturePath ?? null,
    monthlySalary: emp.monthlySalary ?? undefined,
    hourlySalary: emp.hourlySalary ?? undefined,
    monthlyHours: emp.monthlyHours ?? undefined,
    checkedIn: emp.checkedIn,
    city: emp.city,
    absenceRecords: emp.absenceRecords?.map(fromAbsenceRecordDTO) ?? undefined,
    attendanceRecords: emp.attendanceRecords?.map(fromAttendanceRecordDTO) ?? undefined,
  }
}

export function fromCreateEmployeeDTO(emp: CreateEmployeeDTO): CreateEmployee {
  return {
    name: emp.name,
    companyId: emp.companyId,
    departmentId: emp.departmentId,
    checkedIn: false,
    birthdate: new UTCDateMini(emp.birthdate),
    employeeTypeId: emp.employeeTypeId,
    address: emp.address,
    city: emp.city,
    monthlySalary: emp.monthlySalary ?? undefined,
    hourlySalary: emp.hourlySalary ?? undefined,
    monthlyHours: emp.monthlyHours ?? undefined,
  }
}

export function fromAttendanceRecordDTO(rec: AttendanceRecordDTO): AttendanceRecord {
  return {
    id: rec.id,
    employeeId: rec.employeeId,
    checkIn: new UTCDateMini(rec.checkIn),
    checkOut: rec.checkOut ? new UTCDateMini(rec.checkOut) : undefined,
    autoClosed: rec.autoClosed,
  }
}

export function fromAbsenceRecordDTO(rec: AbsenceRecordDTO): AbsenceRecord {
  return {
    id: rec.id,
    employeeId: rec.employeeId,
    startDate: new UTCDateMini(rec.startDate),
    endDate: new UTCDateMini(rec.endDate),
    absenceTypeId: rec.absenceTypeId,
    absenceType: rec.absenceType,
  }
}

export function toAttendanceRecordDTO(rec: AttendanceRecord): AttendanceRecordDTO {
  return {
    id: rec.id,
    employeeId: rec.employeeId,
    checkIn: rec.checkIn.toISOString(),
    checkOut: rec.checkOut?.toISOString() ?? null,
    autoClosed: rec.autoClosed,
  }
}

export function toAbsenceRecordDTO(rec: AbsenceRecord): AbsenceRecordDTO {
  return {
    id: rec.id,
    employeeId: rec.employeeId,
    startDate: toDateOnly(rec.startDate),
    endDate: toDateOnly(rec.endDate),
    absenceTypeId: rec.absenceTypeId,
    absenceType: toAbsenceTypeDTO(rec.absenceType),
  }
}

export function toSimpleEmployeeDTO(emp: SimpleEmployee): SimpleEmployeeDTO {
  return {
    id: emp.id,
    name: emp.name,
    checkedIn: emp.checkedIn,
    absence: emp.absence ? toAbsenceRecordDTO(emp.absence) : null,
    profilePicturePath: emp.profilePicturePath,
    companyId: emp.companyId,
    departmentId: emp.departmentId,
  }
}

export function toDepartmentDTO(dep: Department): DepartmentDTO {
  return {
    id: dep.id,
    name: dep.name,
    companyId: dep.companyId,
  }
}

export function toEmployeeTypeDTO(et: EmployeeType): EmployeeTypeDTO {
  return {
    id: et.id,
    name: et.name,
    companyId: et.companyId,
  }
}

export function toAbsenceTypeDTO(at: AbsenceType): AbsenceTypeDTO {
  return {
    id: at.id,
    name: at.name,
    companyId: at.companyId,
  }
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    role: user.role ?? null,
    shouldChangePassword: user.shouldChangePassword,
    password: null,
  }
}
