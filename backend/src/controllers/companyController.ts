import { Request, Response } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { Failure } from '../utils/Result.js'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { IDepartmentService } from '../interfaces/services/IDepartmentService.js'
import { IUserService } from '../interfaces/services/IUserService.js'
import { IEmployeeTypeService } from '../interfaces/services/IEmployeeTypeService.js'
import { IAbsenceTypeService } from '../interfaces/services/IAbsenceTypeService.js'
import {
  fromCompanyDTO,
  toAbsenceTypeDTO,
  toCompanyDTO,
  toDepartmentDTO,
  toEmployeeDTO,
  toEmployeeTypeDTO,
  toSimpleEmployeeDTO,
  toUserDTO,
} from '../utils/mappers.js'
import { ValidationError } from '../utils/Errors.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import { UTCDateMini } from '@date-fns/utc'

export class CompanyController {
  constructor(
    private readonly companyService: ICompanyService,
    private readonly employeeService: IEmployeeService,
    private readonly departmentService: IDepartmentService,
    private readonly userService: IUserService,
    private readonly employeeTypeService: IEmployeeTypeService,
    private readonly absenceTypeService: IAbsenceTypeService,
    private readonly attendanceService: IAttendanceService
  ) {}

  // --- Company Endpoints ---

  public getAllCompanies = async (req: Request, res: Response) => {
    req.log?.debug('Fetching all companies')

    const result = await this.companyService.getAllCompanies()
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message }, 'Failed to fetch all companies')
      res.status(500).json({ message: result.error.message })
      return
    }
    req.log?.debug({ count: result.value.length }, 'Successfully fetched all companies')

    res.status(200).json({ companies: result.value.map(toCompanyDTO) })
  }

  public createCompany = async (req: Request, res: Response) => {
    const { name } = fromCompanyDTO(req.body)

    req.log?.info({ name }, 'Attempting to create company')

    const result = await this.companyService.createCompany(name)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, name }, 'Failed to create company')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ companyId: result.value.id, name }, 'Company created successfully')
    res.status(201).json({ company: toCompanyDTO(result.value) })
  }

  // --- Employee Endpoints ---

  public getAllEmployeesByCompany = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    req.log?.debug({ companyId }, 'Fetching all employees by company')

    const result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch employees by company')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched employees by company')
    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  public getAllEmployeesByCompanyAndDepartment = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)

    req.log?.debug({ companyId, departmentId }, 'Fetching employees by company and department')

    const result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    if (result instanceof Failure) {
      req.log?.error(
        { error: result.error.message, companyId, departmentId },
        'Failed to fetch employees by company/dept'
      )
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug(
      { companyId, departmentId, count: result.value.length },
      'Successfully fetched employees by company/dept'
    )
    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  public getAllSimpleEmployeesByCompanyAndDepartment = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)

    req.log?.debug({ companyId, departmentId }, 'Fetching simple employees by company and department')

    const result = await this.employeeService.getSimpleEmployeesByDepartment(companyId, departmentId)

    if (result instanceof Failure) {
      req.log?.error(
        { error: result.error.message, companyId, departmentId },
        'Failed to fetch simple employees by company/dept'
      )
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug(
      { companyId, departmentId, count: result.value.length },
      'Successfully fetched simple employees by company/dept'
    )
    res.status(200).json({ employees: result.value.map(toSimpleEmployeeDTO) })
  }

  public getSimpleEmployees = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    req.log?.debug({ companyId }, 'Fetching all simple employees by company')

    const result = await this.employeeService.getSimpleEmployees(companyId)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch simple employees')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched simple employees')
    res.status(200).json({ employees: result.value.map(toSimpleEmployeeDTO) })
  }

  public getAllManagers = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    req.log?.debug({ companyId }, 'Fetching all managers by company')

    const result = await this.userService.getAllManagersByCompanyId(companyId)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch managers')
      res.status(500).json({ message: result.error.message })
      return
    }
    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched managers')

    res.status(200).json({
      managers: result.value.map(toUserDTO),
    })
  }

  public getAllUsers = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    req.log?.debug({ companyId }, 'Fetching all users by company')

    const result = await this.userService.getAllUsersByCompanyId(companyId)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch all users')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched all users')
    res.status(200).json({
      users: result.value.map(toUserDTO),
    })
  }

  // --- Department Endpoints ---

  public getDepartmentsByCompanyId = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    req.log?.debug({ companyId }, 'Fetching departments by company')

    const result = await this.departmentService.getDepartmentsByCompanyId(companyId)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch departments')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched departments')
    res.status(200).json({ departments: result.value.map(toDepartmentDTO) })
  }

  public createDepartment = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    req.log?.info({ companyId, name }, 'Attempting to create department')

    const result = await this.departmentService.createDepartment(companyId, name)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId, name }, 'Failed to create department')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ companyId, departmentId: result.value.id }, 'Department created successfully')
    return res.status(201).json({ department: toDepartmentDTO(result.value) })
  }

  public renameDepartment = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    req.log?.info({ departmentId: id, newName: name }, 'Attempting to rename department')

    const result = await this.departmentService.renameDepartment(id, name)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, departmentId: id, newName: name }, 'Failed to rename department')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ departmentId: id }, 'Department renamed successfully')
    return res.status(200).json({ department: toDepartmentDTO(result.value) })
  }

  public deleteDepartment = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    req.log?.warn({ departmentId: id }, 'Attempting to delete department')

    const result = await this.departmentService.deleteDepartment(id)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, departmentId: id }, 'Failed to delete department')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ departmentId: id }, 'Department deleted successfully')
    return res.status(204).send()
  }

  // --- Employee Type Endpoints ---

  public getEmployeeTypesByCompany = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    req.log?.debug({ companyId }, 'Fetching employee types by company')

    const result = await this.employeeTypeService.getEmployeeTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch employee types')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched employee types')
    res.status(200).json({ employeeTypes: result.value.map(toEmployeeTypeDTO) })
  }

  public createEmployeeType = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    req.log?.info({ companyId, name }, 'Attempting to create employee type')

    const result = await this.employeeTypeService.createEmployeeType(name, companyId)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId, name }, 'Failed to create employee type')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ companyId, employeeTypeId: result.value.id }, 'Employee type created successfully')
    return res.status(201).json({ employeeType: toEmployeeTypeDTO(result.value) })
  }

  public renameEmployeeType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    req.log?.info({ employeeTypeId: id, newName: name }, 'Attempting to rename employee type')

    const result = await this.employeeTypeService.renameEmployeeType(id, name)
    if (result instanceof Failure) {
      req.log?.error(
        { error: result.error.message, employeeTypeId: id, newName: name },
        'Failed to rename employee type'
      )
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ employeeTypeId: id }, 'Employee type renamed successfully')
    return res.status(200).json({ employeeType: toEmployeeTypeDTO(result.value) })
  }

  public deleteEmployeeType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    req.log?.warn({ employeeTypeId: id }, 'Attempting to delete employee type')

    const result = await this.employeeTypeService.deleteEmployeeType(id)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, employeeTypeId: id }, 'Failed to delete employee type')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ employeeTypeId: id }, 'Employee type deleted successfully')
    return res.status(204).send()
  }

  // --- Absence Type Endpoints ---

  public getAbsenceTypesByCompany = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)

    req.log?.debug({ companyId }, 'Fetching absence types by company')

    const result = await this.absenceTypeService.getAbsenceTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId }, 'Failed to fetch absence types')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Successfully fetched absence types')
    return res.status(200).json({ absenceTypes: result.value.map(toAbsenceTypeDTO) })
  }

  public createAbsenceType = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    req.log?.info({ companyId, name }, 'Attempting to create absence type')

    const result = await this.absenceTypeService.createAbsenceType(name, companyId)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId, name }, 'Failed to create absence type')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ companyId, absenceTypeId: result.value.id }, 'Absence type created successfully')
    return res.status(201).json({ absenceType: toAbsenceTypeDTO(result.value) })
  }

  public renameAbsenceType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    req.log?.info({ absenceTypeId: id, newName: name }, 'Attempting to rename absence type')

    const result = await this.absenceTypeService.renameAbsenceType(id, name)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, absenceTypeId: id, newName: name }, 'Failed to rename absence type')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ absenceTypeId: id }, 'Absence type renamed successfully')
    return res.status(200).json({ absenceType: toAbsenceTypeDTO(result.value) })
  }

  public deleteAbsenceType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    req.log?.warn({ absenceTypeId: id }, 'Attempting to delete absence type')

    const result = await this.absenceTypeService.deleteAbsenceType(id)

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, absenceTypeId: id }, 'Failed to delete absence type')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ absenceTypeId: id }, 'Absence type deleted successfully')
    return res.status(204).send()
  }

  public createUser = async (req: Request, res: Response) => {
    const companyId = req.companyId
    const { email, password, username, shouldChangePassword, role } = req.body

    req.log?.info({ email, username, companyId }, 'Attempting to create user (admin action)')

    if (!companyId) {
      req.log?.error('CompanyId missing during admin user creation')
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }
    const result = await this.userService.register(email, password, username, shouldChangePassword, role, companyId)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      if (status === 409) {
        req.log?.warn({ email, error: result.error.message }, 'User creation failed (Conflict)')
      } else {
        req.log?.error({ email, error: result.error.message }, 'User creation failed (Internal Server Error)')
      }
      return res.status(status).json({ error: result.error.message })
    }

    req.log?.info({ userId: result.value.id }, 'User created successfully')
    return res.status(204).send()
  }

  public updateUser = async (req: Request, res: Response) => {
    const companyId = req.companyId
    const { userId, email, password, username, shouldChangePassword, role } = req.body

    req.log?.info({ userId, companyId }, 'Attempting to update user (admin action)')

    if (!companyId) {
      req.log?.error('CompanyId missing during admin user update')
      return res.status(500).json({ message: 'CompanyId must be provided...' })
    }

    const result = await this.userService.updateUser(userId, companyId, {
      email,
      password,
      username,
      shouldChangePassword,
      role,
    })

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      if (status === 409) {
        req.log?.warn({ userId, error: result.error.message }, 'User update failed (Conflict)')
      } else {
        req.log?.error({ userId, error: result.error.message }, 'User update failed (Internal Server Error)')
      }
      return res.status(status).json({ error: result.error.message })
    }
    req.log?.info({ userId }, 'User updated successfully')
    return res.status(204).send()
  }

  public deleteUser = async (req: Request, res: Response) => {
    const companyId = req.companyId
    const id = parseInt(req.params.id, 10)

    req.log?.warn({ userId: id, companyId }, 'Attempting to delete user (admin action)')

    if (!companyId) {
      req.log?.error('CompanyId missing during admin user deletion')
      return res.status(500).json({ message: 'CompanyId must be provided...' })
    }
    const result = await this.userService.deleteUser(id, companyId)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      if (status === 409) {
        req.log?.warn({ userId: id, error: result.error.message }, 'User deletion failed (Conflict)')
      } else {
        req.log?.error({ userId: id, error: result.error.message }, 'User deletion failed (Internal Server Error)')
      }
      return res.status(status).json({ error: result.error.message })
    }

    req.log?.info({ userId: id }, 'User deleted successfully')
    return res.status(204).send()
  }

  // --- Attendance Endpoints ---

  public getDailyOverview = async (req: Request, res: Response) => {
    const companyId = req.companyId
    const { date } = req.query

    req.log?.debug({ companyId, date }, 'Fetching daily attendance overview')

    if (!companyId) {
      req.log?.error('CompanyId missing when fetching daily overview')
      return res.status(500).json({ message: 'CompanyId must be provided...' })
    }

    if (!date) {
      req.log?.warn('Missing date query parameter for daily overview (400)')
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' })
    }

    const dayStart = new UTCDateMini(`${date}T00:00:00`)
    const dayEnd = new UTCDateMini(`${date}T23:59:59`)

    const recs = await this.attendanceService.getDailyOverview(companyId, dayStart, dayEnd)
    if (recs instanceof Failure) {
      const status = recs.error instanceof ValidationError ? 409 : 500
      if (status === 409) {
        req.log?.warn({ companyId, date, error: recs.error.message }, 'Fetching daily overview failed (Conflict)')
      } else {
        req.log?.error(
          { companyId, date, error: recs.error.message },
          'Fetching daily overview failed (Internal Server Error)'
        )
      }
      return res.status(status).json({ error: recs.error.message })
    }

    req.log?.debug({ companyId, date, count: recs.value.length }, 'Daily overview fetched successfully')
    return res.status(200).json({ records: recs.value })
  }
}
