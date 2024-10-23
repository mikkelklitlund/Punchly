import { IAbsenceService } from '../interfaces/services/IAbsenceService'
import { IAttendanceService } from '../interfaces/services/IAttendanceService'
import { ICompanyService } from '../interfaces/services/ICompanyService'
import { IDepartmentService } from '../interfaces/services/IDepartmentService'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { IEmployeeTypeService } from '../interfaces/services/IEmployeeTypeService'
import { IUserService } from '../interfaces/services/IUserService'
import { RepositoryContainer } from '../repositories/RepositoryContainer.'
import { AbsenceService } from './AbsenceService'
import { AttendanceService } from './AttendanceService'
import { CompanyService } from './CompanyService'
import { DepartmentService } from './DepartmentService'
import { EmployeeService } from './EmployeeService'
import { EmployeeTypeService } from './EmployeeTypeService'
import { UserService } from './UserService'

export class ServiceContainer {
  public absenceService: IAbsenceService
  public attendanceService: IAttendanceService
  public companyService: ICompanyService
  public departmentService: IDepartmentService
  public employeeService: IEmployeeService
  public employeeTypeService: IEmployeeTypeService
  public userService: IUserService

  constructor(repositoryContainer: RepositoryContainer) {
    this.absenceService = new AbsenceService(repositoryContainer.absenceRepository)
    this.attendanceService = new AttendanceService(
      repositoryContainer.attendanceRepository,
      repositoryContainer.employeeRepository
    )
    this.companyService = new CompanyService(repositoryContainer.companyRepository)
    this.departmentService = new DepartmentService(repositoryContainer.departmentRepository)
    this.employeeService = new EmployeeService(
      repositoryContainer.employeeRepository,
      repositoryContainer.companyRepository,
      repositoryContainer.departmentRepository,
      repositoryContainer.employeeTypeRepository
    )
    this.employeeTypeService = new EmployeeTypeService(repositoryContainer.employeeTypeRepository)
    this.userService = new UserService(repositoryContainer.userRepository)
  }
}
