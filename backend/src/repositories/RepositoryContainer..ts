import { PrismaClient } from '@prisma/client'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository'
import { IAttendanceRecordRepository } from '../interfaces/repositories/IAttendanceRecordRepository'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository'
import { IDepartmentRepository } from '../interfaces/repositories/IDepartmentRepository'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository'
import { IUserRepository } from '../interfaces/repositories/IUserRepository'
import { AbsenceRecordRepository } from './AbsenceRecordRepository'
import { CompanyRepository } from './CompanyRepository'
import { AttendanceRecordRepository } from './AttendanceRecordRepository'
import { EmployeeRepository } from './EmployeeRepository'
import { DepartmentRepository } from './DepartmentRepository'
import { UserRepository } from './UserRepository'
import { EmployeeTypeRepository } from './EmployeeTypeRepository'

export class RepositoryContainer {
  public absenceRepository: IAbsenceRecordRepository
  public companyRepository: ICompanyRepository
  public attendanceRepository: IAttendanceRecordRepository
  public employeeRepository: IEmployeeRepository
  public departmentRepository: IDepartmentRepository
  public userRepository: IUserRepository
  public employeeTypeRepository: IEmployeeTypeRepository

  constructor(prisma: PrismaClient) {
    this.absenceRepository = new AbsenceRecordRepository(prisma)
    this.companyRepository = new CompanyRepository(prisma)
    this.attendanceRepository = new AttendanceRecordRepository(prisma)
    this.employeeRepository = new EmployeeRepository(prisma)
    this.departmentRepository = new DepartmentRepository(prisma)
    this.userRepository = new UserRepository(prisma)
    this.employeeTypeRepository = new EmployeeTypeRepository(prisma)
  }
}
