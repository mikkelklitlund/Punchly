import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { Failure } from '../utils/Result.js'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth.js'
import { IDepartmentService } from '../interfaces/services/IDepartmentService.js'
import authorizeRoles from '../middleware/authorizeRole.js'
import { Role } from 'shared'
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

export class CompanyRoutes {
  public router: Router

  constructor(
    private readonly companyService: ICompanyService,
    private readonly employeeService: IEmployeeService,
    private readonly departmentService: IDepartmentService,
    private readonly userService: IUserService,
    private readonly employeeTypeService: IEmployeeTypeService,
    private readonly absenceTypeService: IAbsenceTypeService
  ) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get('/:companyId/employees', authMiddleware, this.getAllEmployeesByCompany.bind(this))

    this.router.get(
      '/:companyId/:departmentId/employees',
      authMiddleware,
      this.getAllEmployeesByCompanyAndDepartment.bind(this)
    )

    this.router.get(
      '/:companyId/:departmentId/simple-employees',
      authMiddleware,
      this.getAllSimpleEmployeesByCompanyAndDepartment.bind(this)
    )

    this.router.get(
      '/:companyId/managers',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      this.getAllManagers.bind(this)
    )

    this.router.get('/:companyId/departments', authMiddleware, this.getDepartmentsByCompanyId.bind(this))

    this.router.get('/:companyId/simple-employees', authMiddleware, this.getSimpleEmployees.bind(this))

    this.router.get('/all', this.getAllCompanies.bind(this))

    this.router.post(
      '/',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [
        body('name').notEmpty().withMessage('Name is required'),
        body('address').notEmpty().withMessage('Address is required'),
      ],
      this.createCompany.bind(this)
    )

    this.router.get('/:companyId/employee-types', authMiddleware, this.getEmployeeTypesByCompany.bind(this))

    this.router.post(
      '/:companyId/departments',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.createDepartment.bind(this)
    )

    this.router.patch(
      '/:companyId/departments/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.renameDepartment.bind(this)
    )

    this.router.delete(
      '/:companyId/departments/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [],
      this.deleteDepartment.bind(this)
    )

    this.router.post(
      '/:companyId/employee-types',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.createEmployeeType.bind(this)
    )

    this.router.patch(
      '/:companyId/employee-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.renameEmployeeType.bind(this)
    )

    this.router.delete(
      '/:companyId/employee-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      this.deleteEmployeeType.bind(this)
    )

    this.router.get('/:companyId/absence-types', authMiddleware, this.getAbsenceTypesByCompany.bind(this))

    this.router.post(
      '/:companyId/absence-types',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.createAbsenceType.bind(this)
    )

    this.router.patch(
      '/:companyId/absence-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.renameAbsenceType.bind(this)
    )

    this.router.delete(
      '/:companyId/absence-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      this.deleteAbsenceType.bind(this)
    )
  }

  private async getAllManagers(req: Request, res: Response) {
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

  private async getAllSimpleEmployeesByCompanyAndDepartment(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)
    const result = await this.employeeService.getSimpleEmployeesByDepartment(companyId, departmentId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value.map(toSimpleEmployeeDTO) })
  }

  private async getSimpleEmployees(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)
    const result = await this.employeeService.getSimpleEmployees(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value.map(toSimpleEmployeeDTO) })
  }

  private async getAllEmployeesByCompanyAndDepartment(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)

    const result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  private async getDepartmentsByCompanyId(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.departmentService.getDepartmentsByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ departments: result.value.map(toDepartmentDTO) })
  }

  private async createCompany(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const { name, address } = fromCompanyDTO(req.body)
    const result = await this.companyService.createCompany(name, address)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ company: toCompanyDTO(result.value) })
  }

  private async getAllCompanies(req: Request, res: Response) {
    const result = await this.companyService.getAllCompanies()
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ companies: result.value.map(toCompanyDTO) })
  }

  private async getAllEmployeesByCompany(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  private async getEmployeeTypesByCompany(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeTypeService.getEmployeeTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employeeTypes: result.value.map(toEmployeeTypeDTO) })
  }

  private async createDepartment(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    const result = await this.departmentService.createDepartment(companyId, name)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    return res.status(201).json({ department: toDepartmentDTO(result.value) })
  }

  private async renameDepartment(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    const result = await this.departmentService.renameDepartment(id, name)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    return res.status(200).json({ department: toDepartmentDTO(result.value) })
  }

  private async deleteDepartment(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10)

    const result = await this.departmentService.deleteDepartment(id)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    return res.status(204).send()
  }

  private async createEmployeeType(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    const result = await this.employeeTypeService.createEmployeeType(name, companyId)
    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(201).json({ employeeType: toEmployeeTypeDTO(result.value) })
  }

  private async renameEmployeeType(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }

    const result = await this.employeeTypeService.renameEmployeeType(id, name)
    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(200).json({ employeeType: toEmployeeTypeDTO(result.value) })
  }

  private async deleteEmployeeType(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10)

    const result = await this.employeeTypeService.deleteEmployeeType(id)
    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(204).send()
  }

  private async getAbsenceTypesByCompany(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId, 10)

    const result = await this.absenceTypeService.getAbsenceTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(200).json({ absenceTypes: result.value.map(toAbsenceTypeDTO) })
  }

  private async createAbsenceType(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const companyId = parseInt(req.params.companyId, 10)
    const { name } = req.body as { name: string }

    const result = await this.absenceTypeService.createAbsenceType(name, companyId)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }
    return res.status(201).json({ absenceType: toAbsenceTypeDTO(result.value) })
  }

  private async renameAbsenceType(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const id = parseInt(req.params.id, 10)
    const { name } = req.body as { name: string }
    const result = await this.absenceTypeService.renameAbsenceType(id, name)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(200).json({ absenceType: toAbsenceTypeDTO(result.value) })
  }

  private async deleteAbsenceType(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10)
    const result = await this.absenceTypeService.deleteAbsenceType(id)

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    return res.status(204).send()
  }
}
