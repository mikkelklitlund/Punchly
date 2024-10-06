export interface Company {
    id: number;
    address: string;
    name: string;
    employees: Employee[];
    department: Department[];
    employeeTypes: EmployeeType[];
    users: UserCompanyAccess[];
}

export interface User {
    id: number;
    email: string;
    password: string;
    username: string;
    companyAccesses: UserCompanyAccess[];
}

export interface UserCompanyAccess {
    userId: number;
    companyId: number;
    role: Role;
}

export interface Department {
    id: number;
    name: string;
    companyId: number;
    employees: Employee[];
}

export interface Employee {
    id: number;
    name: string;
    profilePicturePath: string;
    companyId: number;
    departmentId: number;
    checkedIn: boolean;
    birthday: Date;
    employeeTypeId: number;
    monthlySalary?: number;
    hourlySalary?: number;
    address: string;
    city: string;
    absenceRecords?: AbsenceRecord[];
    attendanceRecords?: AttendanceRecord[];
}

export interface CreateEmployee {
    name: string;
    profilePicturePath: string;
    companyId: number;
    departmentId: number;
    checkedIn: boolean;
    birthday: Date;
    employeeTypeId: number;
    monthlySalary?: number;
    hourlySalary?: number;
    address: string;
    city: string;
}

export interface EmployeeType {
    id: number;
    name: string;
    companyId: number;
}

export interface AbsenceRecord {
    id: number;
    employeeId: number;
    startDate: Date;
    endDate?: Date;
    absenceType: AbsenceType;
}

export interface AttendanceRecord {
    id: number;
    employeeId: number;
    date: Date;
    checkIn: Date;
    checkOut?: Date;
}

export enum AbsenceType {
    VACATION,
    SICK,
    HOMEDAY,
    PUBLIC_HOLIDAY
}

export enum Role {
    ADMIN,
    USER
}