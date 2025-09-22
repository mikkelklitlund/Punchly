export type Company = {
  id: number
  address: string
  name: string
}

export type User = {
  id: number
  email: string
  password: string
  username: string
  deletedAt?: Date
}

export type UserRefreshToken = {
  id: number
  token: string
  userId: number
  expiryDate: Date
  revoked: boolean
  createdAt: Date
}

export type UserCompanyAccess = {
  userId: number
  companyId: number
  role: Role
}

export type Department = {
  id: number
  name: string
  companyId: number
}

export type SimpleEmployee = {
  id: number
  name: string
  profilePicturePath: string
  companyId: number
  departmentId: number
  checkedIn: boolean
  absence?: AbsenceRecord
}

export type Employee = {
  id: number
  name: string
  profilePicturePath: string
  companyId: number
  departmentId: number
  checkedIn: boolean
  birthdate: Date
  employeeTypeId: number
  monthlySalary?: number
  monthlyHours?: number
  hourlySalary?: number
  address: string
  city: string
  absenceRecords?: AbsenceRecord[]
  attendanceRecords?: AttendanceRecord[]
}

export type CreateEmployee = {
  name: string
  companyId: number
  departmentId: number
  checkedIn: boolean
  birthdate: Date
  employeeTypeId: number
  monthlySalary?: number
  monthlyHours?: number
  hourlySalary?: number
  address: string
  city: string
}

export type EmployeeType = {
  id: number
  name: string
  companyId: number
}

export type CreateAbsenceRecord = {
  employeeId: number
  startDate: Date
  endDate: Date
  absenceTypeId: number
}

export type AbsenceRecord = {
  id: number
  employeeId: number
  startDate: Date
  endDate: Date
  absenceTypeId: number
  absenceType: AbsenceType
}

export type AbsenceType = {
  id: number
  name: string
  companyId: number
}

export type AttendanceRecord = {
  id: number
  employeeId: number
  checkIn: Date
  checkOut?: Date
  autoClosed: boolean
}

export type CreateAttendanceRecord = {
  employeeId: number
  checkIn?: Date
  checkOut?: Date
}

export type EmployeeWithRecords = Employee & {
  attendanceRecords: AttendanceRecord[]
  absenceRecords: AbsenceRecord[]
  department: Department
  employeeType: EmployeeType
}

export type ManagerInvite = {
  id: number
  email: string
  companyId: number
  token: string
  expiryDate: Date
  used: boolean
}
