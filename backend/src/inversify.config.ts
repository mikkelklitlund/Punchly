import 'reflect-metadata'
import { Container } from 'inversify'
import { UserService } from './services/UserService'
import { IUserService } from './interfaces/services/IUserService'
import { IUserRepository } from './interfaces/repositories/IUserRepository'
import { UserRepository } from './repositories/UserRepository'
import { IAbsenceRecordRepository } from './interfaces/repositories/IAbsenceRecordRepository'
import { AbsenceRecordRepository } from './repositories/AbsenceRecordRepository'
import { IAttendanceRecordRepository } from './interfaces/repositories/IAttendanceRecordRepository'
import { AttendanceRecordRepository } from './repositories/AttendanceRecordRepository'
import { ICompanyRepository } from './interfaces/repositories/ICompanyRepository'
import { CompanyRepository } from './repositories/CompanyRepository'
import { IDepartmentRepository } from './interfaces/repositories/IDepartmentRepository'
import { DepartmentRepository } from './repositories/DepartmentRepository'
import { EmployeeRepository } from './repositories/EmployeeRepository'
import { IEmployeeTypeRepository } from './interfaces/repositories/IEmployeeTypeRepository'
import { EmployeeTypeRepository } from './repositories/EmployeeTypeRepository'
import { IAbsenceService } from './interfaces/services/IAbsenceService'
import { AbsenceService } from './services/AbsenceService'
import { IAttendanceService } from './interfaces/services/IAttendanceService'
import { AttendanceService } from './services/AttendanceService'
import { ICompanyService } from './interfaces/services/ICompanyService'
import { CompanyService } from './services/CompanyService'
import { IDepartmentService } from './interfaces/services/IDepartmentService'
import { DepartmentService } from './services/DepartmentService'
import { IEmployeeService } from './interfaces/services/IEmployeeService'
import { EmployeeService } from './services/EmployeeService'
import { IEmployeeTypeService } from './interfaces/services/IEmployeeTypeService'
import { EmployeeTypeService } from './services/EmployeeTypeService'
import { IEmployeeRepository } from './interfaces/repositories/IEmployeeRepositry'

const TYPES = {
  IUserRepository: Symbol.for('IUserRepository'),
  IUserService: Symbol.for('IUserService'),
  IAbsenceRecordRepository: Symbol.for('IAbsenceRecordRepository'),
  IAttendanceRecordRepository: Symbol.for('IAttendanceRecordRepository'),
  ICompanyRepository: Symbol.for('ICompanyRepository'),
  IDepartmentRepository: Symbol.for('IDepartmentRepository'),
  IEmployeeRepository: Symbol.for('IEmployeeRepository'),
  IEmployeeTypeRepository: Symbol.for('IEmployeeTypeRepository'),
  IAbsenceService: Symbol.for('IAbsenceService'),
  IAttendanceService: Symbol.for('IAttendanceService'),
  ICompanyService: Symbol.for('ICompanyService'),
  IDepartmentService: Symbol.for('IDepartmentService'),
  IEmployeeService: Symbol.for('IEmployeeService'),
  IEmployeeTypeService: Symbol.for('IEmployeeTypeService'),
}

const container = new Container()

// Repositories
container.bind<IAbsenceRecordRepository>(TYPES.IAbsenceRecordRepository).to(AbsenceRecordRepository)
container.bind<IAttendanceRecordRepository>(TYPES.IAttendanceRecordRepository).to(AttendanceRecordRepository)
container.bind<ICompanyRepository>(TYPES.ICompanyRepository).to(CompanyRepository)
container.bind<IDepartmentRepository>(TYPES.IDepartmentRepository).to(DepartmentRepository)
container.bind<IEmployeeRepository>(TYPES.IEmployeeRepository).to(EmployeeRepository)
container.bind<IEmployeeTypeRepository>(TYPES.IEmployeeTypeRepository).to(EmployeeTypeRepository)
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository)

// Services
container.bind<IAbsenceService>(TYPES.IAbsenceService).to(AbsenceService)
container.bind<IAttendanceService>(TYPES.IAttendanceService).to(AttendanceService)
container.bind<ICompanyService>(TYPES.ICompanyService).to(CompanyService)
container.bind<IDepartmentService>(TYPES.IDepartmentService).to(DepartmentService)
container.bind<IEmployeeService>(TYPES.IEmployeeService).to(EmployeeService)
container.bind<IEmployeeTypeService>(TYPES.IEmployeeTypeService).to(EmployeeTypeService)
container.bind<IUserService>(TYPES.IUserService).to(UserService)

export { container, TYPES }
