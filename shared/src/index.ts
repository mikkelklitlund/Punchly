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
	absenceType: AbsenceType
}

export type AbsenceRecord = {
	id: number
	employeeId: number
	startDate: Date
	endDate: Date
	absenceType: AbsenceType
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
	checkIn: Date
}

export type EmployeeWithRecords = Employee & {
	attendanceRecords: AttendanceRecord[]
	absenceRecords: AbsenceRecord[]
	department: Department
	employeeType: EmployeeType
}

export enum AbsenceType {
	VACATION = 'VACATION',
	SICK = 'SICK',
	HOMEDAY = 'HOMEDAY',
	PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY'
}

export enum Role {
	COMPANY = 'COMPANY',
	MANAGER = 'MANAGER',
	ADMIN = 'ADMIN'
}
