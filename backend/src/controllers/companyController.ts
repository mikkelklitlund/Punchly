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
import { logger } from '../logger.js'

export class CompanyController {
  constructor(
    private readonly companyService: ICompanyService,
    private readonly employeeService: IEmployeeService,
    private readonly departmentService: IDepartmentService,
    private readonly userService: IUserService,
    private readonly employeeTypeService: IEmployeeTypeService,
    private readonly absenceTypeService: IAbsenceTypeService
  ) {}

  public getAllCompanies = async (req: Request, res: Response) => {
    const result = await this.companyService.getAllCompanies()
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ companies: result.value.map(toCompanyDTO) })
  }

  public createCompany = async (req: Request, res: Response) => {
    const { name, address } = fromCompanyDTO(req.body)
    const result = await this.companyService.createCompany(name, address)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ company: toCompanyDTO(result.value) })
  }

  // --- Employee Endpoints ---

  public getAllEmployeesByCompany = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  public getAllEmployeesByCompanyAndDepartment = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)

    const result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  public getAllSimpleEmployeesByCompanyAndDepartment = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)
    const result = await this.employeeService.getSimpleEmployeesByDepartment(companyId, departmentId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value.map(toSimpleEmployeeDTO) })
  }

  public getSimpleEmployees = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)
    const result = await this.employeeService.getSimpleEmployees(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value.map(toSimpleEmployeeDTO) })
  }

  public getAllManagers = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    const result = await this.userService.getAllManagersByCompanyId(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({
      managers: result.value.map(toUserDTO),
    })
  }

  public getAllUsers = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    const result = await this.userService.getAllUsersByCompanyId(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({
      users: result.value.map(toUserDTO),
    })
  }

  public getDepartmentsByCompanyId = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    const result = await this.departmentService.getDepartmentsByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ departments: result.value.map(toDepartmentDTO) })
  }

  public createDepartment = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    const result = await this.departmentService.createDepartment(companyId, name)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    return res.status(201).json({ department: toDepartmentDTO(result.value) })
  }

  public renameDepartment = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    const result = await this.departmentService.renameDepartment(id, name)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    return res.status(200).json({ department: toDepartmentDTO(result.value) })
  }

  public deleteDepartment = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    const result = await this.departmentService.deleteDepartment(id)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    return res.status(204).send()
  }

  public getEmployeeTypesByCompany = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeTypeService.getEmployeeTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employeeTypes: result.value.map(toEmployeeTypeDTO) })
  }

  public createEmployeeType = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    const result = await this.employeeTypeService.createEmployeeType(name, companyId)
    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(201).json({ employeeType: toEmployeeTypeDTO(result.value) })
  }

  public renameEmployeeType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    const result = await this.employeeTypeService.renameEmployeeType(id, name)
    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(200).json({ employeeType: toEmployeeTypeDTO(result.value) })
  }

  public deleteEmployeeType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    const result = await this.employeeTypeService.deleteEmployeeType(id)
    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(204).send()
  }

  public getAbsenceTypesByCompany = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)

    const result = await this.absenceTypeService.getAbsenceTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(200).json({ absenceTypes: result.value.map(toAbsenceTypeDTO) })
  }

  public createAbsenceType = async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    const result = await this.absenceTypeService.createAbsenceType(name, companyId)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }
    return res.status(201).json({ absenceType: toAbsenceTypeDTO(result.value) })
  }

  public renameAbsenceType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }
    const result = await this.absenceTypeService.renameAbsenceType(id, name)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(200).json({ absenceType: toAbsenceTypeDTO(result.value) })
  }

  public deleteAbsenceType = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const result = await this.absenceTypeService.deleteAbsenceType(id)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(204).send()
  }

  public createUser = async (req: Request, res: Response) => {
    const companyId = req.companyId
    if (!companyId) {
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }
    const { email, password, username, shouldChangePassword, role } = req.body
    const result = await this.userService.register(email, password, username, shouldChangePassword, role, companyId)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      logger.error({ error: result.error.message }, 'User registration failed')
      return res.status(status).json({ error: result.error.message })
    }

    return res.status(204).send()
  }

  public updateUser = async (req: Request, res: Response) => {
    const companyId = req.companyId
    if (!companyId) {
      return res.status(500).json({ message: 'CompanyId must be provided...' })
    }
    const { userId, email, password, username, shouldChangePassword, role } = req.body
    const result = await this.userService.updateUser(userId, companyId, {
      email,
      password,
      username,
      shouldChangePassword,
      role,
    })

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      logger.error({ error: result.error.message }, 'User update failed')
      return res.status(status).json({ error: result.error.message })
    }

    return res.status(204).send()
  }

  public deleteUser = async (req: Request, res: Response) => {
    const companyId = req.companyId
    if (!companyId) {
      return res.status(500).json({ message: 'CompanyId must be provided...' })
    }
    const id = parseInt(req.params.id, 10)
    const result = await this.userService.deleteUser(id, companyId)

    if (result instanceof Failure) {
      const status = result.error instanceof ValidationError ? 409 : 500
      logger.error({ error: result.error.message }, 'User deletion failed')
      return res.status(status).json({ error: result.error.message })
    }

    return res.status(204).send()
  }
}
