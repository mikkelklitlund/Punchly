import { Logger } from 'pino'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { IAbsenceTypeService } from '../interfaces/services/IAbsenceTypeService.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { IDepartmentService } from '../interfaces/services/IDepartmentService.js'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { IEmployeeTypeService } from '../interfaces/services/IEmployeeTypeService.js'
import { IManagerInviteService } from '../interfaces/services/IManagerInviteService.js'
import { IUserService } from '../interfaces/services/IUserService.js'
import { RepositoryContainer } from '../repositories/RepositoryContainer.js'
import { AbsenceService } from './AbsenceService.js'
import { AbsenceTypeService } from './AbsenceTypeService.js'
import { AttendanceService } from './AttendanceService.js'
import { CompanyService } from './CompanyService.js'
import { DepartmentService } from './DepartmentService.js'
import { EmployeeService } from './EmployeeService.js'
import { EmployeeTypeService } from './EmployeeTypeService.js'
import { ManagerInviteService } from './ManagerInviteService.js'
import { UserService } from './UserService.js'

export class ServiceContainer {
  public absenceService: IAbsenceService
  public attendanceService: IAttendanceService
  public companyService: ICompanyService
  public departmentService: IDepartmentService
  public employeeService: IEmployeeService
  public employeeTypeService: IEmployeeTypeService
  public userService: IUserService
  public absenceTypeService: IAbsenceTypeService
  public managerInviteService: IManagerInviteService

  constructor(repositoryContainer: RepositoryContainer, logger: Logger) {
    this.absenceService = new AbsenceService(repositoryContainer.absenceRepository, logger)
    this.attendanceService = new AttendanceService(
      repositoryContainer.attendanceRepository,
      repositoryContainer.employeeRepository,
      repositoryContainer.absenceRepository,
      logger
    )
    this.companyService = new CompanyService(repositoryContainer.companyRepository, logger)
    this.departmentService = new DepartmentService(repositoryContainer.departmentRepository, logger)
    this.employeeService = new EmployeeService(
      repositoryContainer.employeeRepository,
      repositoryContainer.companyRepository,
      repositoryContainer.departmentRepository,
      repositoryContainer.employeeTypeRepository,
      logger
    )
    this.employeeTypeService = new EmployeeTypeService(repositoryContainer.employeeTypeRepository, logger)
    this.userService = new UserService(repositoryContainer.userRepository, logger)
    this.absenceTypeService = new AbsenceTypeService(repositoryContainer.absenceTypeRepository, logger)
    this.managerInviteService = new ManagerInviteService(repositoryContainer.managerInviteRepository)
  }
}
