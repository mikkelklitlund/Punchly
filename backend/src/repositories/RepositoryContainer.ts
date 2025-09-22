import { PrismaClient } from '@prisma/client'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { IAttendanceRecordRepository } from '../interfaces/repositories/IAttendanceRecordRepository.js'
import { ICompanyRepository } from '../interfaces/repositories/ICompanyRepository.js'
import { IDepartmentRepository } from '../interfaces/repositories/IDepartmentRepository.js'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'
import { IEmployeeTypeRepository } from '../interfaces/repositories/IEmployeeTypeRepository.js'
import { IUserRepository } from '../interfaces/repositories/IUserRepository.js'
import { AbsenceRecordRepository } from './AbsenceRecordRepository.js'
import { CompanyRepository } from './CompanyRepository.js'
import { AttendanceRecordRepository } from './AttendanceRecordRepository.js'
import { EmployeeRepository } from './EmployeeRepository.js'
import { DepartmentRepository } from './DepartmentRepository.js'
import { UserRepository } from './UserRepository.js'
import { EmployeeTypeRepository } from './EmployeeTypeRepository.js'
import { IAbsenceTypeRepository } from '../interfaces/repositories/IAbsenceTypeRepository.js'
import { AbsenceTypeRepository } from './AbsenceTypeRepository.js'
import { IManagerInviteRepository } from '../interfaces/repositories/IManagerInviteRepository.js'
import { ManagerInviteRepository } from './ManagerInviteRepository.js'

export class RepositoryContainer {
  public absenceRepository: IAbsenceRecordRepository
  public companyRepository: ICompanyRepository
  public attendanceRepository: IAttendanceRecordRepository
  public employeeRepository: IEmployeeRepository
  public departmentRepository: IDepartmentRepository
  public userRepository: IUserRepository
  public employeeTypeRepository: IEmployeeTypeRepository
  public absenceTypeRpository: IAbsenceTypeRepository
  public managerInviteRepository: IManagerInviteRepository

  constructor(prisma: PrismaClient) {
    this.absenceRepository = new AbsenceRecordRepository(prisma)
    this.companyRepository = new CompanyRepository(prisma)
    this.attendanceRepository = new AttendanceRecordRepository(prisma)
    this.employeeRepository = new EmployeeRepository(prisma)
    this.departmentRepository = new DepartmentRepository(prisma)
    this.userRepository = new UserRepository(prisma)
    this.employeeTypeRepository = new EmployeeTypeRepository(prisma)
    this.absenceTypeRpository = new AbsenceTypeRepository(prisma)
    this.managerInviteRepository = new ManagerInviteRepository(prisma)
  }
}
