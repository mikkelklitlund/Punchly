export enum Role {
	COMPANY = 'COMPANY',
	MANAGER = 'MANAGER',
	ADMIN = 'ADMIN'
}
export type CompanyDTO = {
	id: number
	address: string
	name: string
}
export type UserDTO = {
	id: number
	email: string
	password: string | null
	username: string
}
export type DepartmentDTO = {
	id: number
	name: string
	companyId: number
}
export type SimpleEmployeeDTO = {
	id: number
	name: string
	profilePicturePath: string
	companyId: number
	departmentId: number
	checkedIn: boolean
	absence: AbsenceRecordDTO | null
}
export type CalendarDate = string
export type EmployeeDTO = {
	id: number
	name: string
	profilePicturePath: string
	companyId: number
	departmentId: number
	checkedIn: boolean
	birthdate: CalendarDate
	employeeTypeId: number
	monthlySalary: number | null
	monthlyHours: number | null
	hourlySalary: number | null
	address: string
	city: string
	absenceRecords: AbsenceRecordDTO[]
	attendanceRecords: AttendanceRecordDTO[]
}
export type CreateEmployeeDTO = {
	name: string
	companyId: number
	departmentId: number
	checkedIn: boolean
	birthdate: CalendarDate
	employeeTypeId: number
	monthlySalary: number | null
	monthlyHours: number | null
	hourlySalary: number | null
	address: string
	city: string
}
export type EmployeeTypeDTO = {
	id: number
	name: string
	companyId: number
}
export type CreateAbsenceRecordDTO = {
	employeeId: number
	startDate: CalendarDate
	endDate: CalendarDate
	absenceTypeId: number
}
export type AbsenceTypeDTO = {
	id: number
	name: string
	companyId: number
}
export type AbsenceRecordDTO = {
	id: number
	employeeId: number
	startDate: CalendarDate
	endDate: CalendarDate
	absenceTypeId: number
	absenceType: AbsenceTypeDTO
}
export type DateTimeUTC = string
export type AttendanceRecordDTO = {
	id: number
	employeeId: number
	checkIn: DateTimeUTC
	checkOut: DateTimeUTC | null
	autoClosed: boolean
}
export type CreateAttendanceRecordDTO = {
	employeeId: number
}
