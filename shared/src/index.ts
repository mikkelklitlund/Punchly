export interface Company {
	id: number
	address: string
	name: string
}

export interface User {
	id: number
	email: string
	password: string
	username: string
}

export interface UserCompanyAccess {
	userId: number
	companyId: number
	role: Role
}

export interface Department {
	id: number
	name: string
	companyId: number
}

export interface Employee {
	id: number
	name: string
	profilePicturePath: string
	companyId: number
	departmentId: number
	checkedIn: boolean
	birthdate: Date
	employeeTypeId: number
	monthlySalary?: number
	hourlySalary?: number
	address: string
	city: string
	absenceRecords?: AbsenceRecord[]
	attendanceRecords?: AttendanceRecord[]
}

export interface CreateEmployee {
	name: string
	profilePicturePath: string
	companyId: number
	departmentId: number
	checkedIn: boolean
	birthdate: Date
	employeeTypeId: number
	monthlySalary?: number
	hourlySalary?: number
	address: string
	city: string
}

export interface EmployeeType {
	id: number
	name: string
	companyId: number
}

export interface CreateAbsenceRecord {
	employeeId: number
	startDate: Date
	endDate: Date
	absenceType: AbsenceType
}

export interface AbsenceRecord {
	id: number
	employeeId: number
	startDate: Date
	endDate: Date
	absenceType: AbsenceType
}

export interface AttendanceRecord {
	id: number
	employeeId: number
	checkIn: Date
	checkOut?: Date
}

export interface CreateAttendanceRecord {
	employeeId: number
	checkIn: Date
}

export enum AbsenceType {
	VACATION = 'VACATION',
	SICK = 'SICK',
	HOMEDAY = 'HOMEDAY',
	PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY'
}

export enum Role {
	ADMIN,
	USER
}
