import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { Failure } from '../utils/Result.js'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth.js'
import { IDepartmentService } from '../interfaces/services/IDepartmentService.js'
import authorizeRoles from '../middleware/authorizeRole.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest.js'
import { Employee, Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'

export class CompanyRoutes {
  public router: Router

  constructor(
    private readonly companyService: ICompanyService,
    private readonly employeeService: IEmployeeService,
    private readonly departmentService: IDepartmentService,
    private readonly userService: IUserService
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

    this.router.get('/:companyId/managers', authMiddleware, authorizeRoles(Role.ADMIN), this.getAllManagers.bind(this))

    this.router.get('/:companyId/departments', authMiddleware, this.getDepartmentsByCompanyId.bind(this))
    this.router.get('/:companyId/simple-employees', authMiddleware, this.getSimpleEmployees.bind(this))

    this.router.get('/all', this.getAllCompanies.bind(this))

    this.router.post(
      '/',
      authMiddleware,
      authorizeRoles(Role.ADMIN),
      [
        body('name').notEmpty().withMessage('Name is required'),
        body('address').notEmpty().withMessage('Address is required'),
      ],
      this.createCompany.bind(this)
    )
  }

  private async validateUserAccess(req: AuthenticatedRequest, res: Response, allowedRoles: Role[]): Promise<boolean> {
    const { username, companyId, role } = req

    if (!username || !companyId || role === undefined) {
      res.status(401).json({ message: 'Invalid request: Missing user credentials' })
      return false
    }

    const accessResult = await this.userService.userHasAccess(username, parseInt(companyId), allowedRoles)

    if (accessResult instanceof Failure) {
      res.status(403).json({ message: accessResult.error.message })
      return false
    }

    return true
  }

  private async getAllManagers(req: Request, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN]))) return
    const companyId = parseInt(req.params.companyId)

    const result = await this.userService.getAllManagersByCompanyId(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({
      managers: result.value,
    })
  }

  private async getAllSimpleEmployeesByCompanyAndDepartment(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)

    const result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({
      employees: result.value.map(this.formatSimpleEmployee),
    })
  }

  private async getSimpleEmployees(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({
      employees: result.value.map(this.formatSimpleEmployee),
    })
  }

  private async getAllEmployeesByCompanyAndDepartment(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)
    const departmentId = parseInt(req.params.departmentId)

    const result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employees: result.value })
  }

  private async getDepartmentsByCompanyId(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.departmentService.getDepartmentsByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ departments: result.value })
  }

  private async createCompany(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const { name, address } = req.body
    const result = await this.companyService.createCompany(name, address)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ company: result.value })
  }

  private async getAllCompanies(req: Request, res: Response) {
    const result = await this.companyService.getAllCompanies()
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ companies: result.value })
  }

  private async getAllEmployeesByCompany(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value })
  }

  private formatSimpleEmployee(em: Employee) {
    return {
      departmentId: em.departmentId,
      companyId: em.companyId,
      id: em.id,
      name: em.name,
      checkedIn: em.checkedIn,
      profilePicturePath: em.profilePicturePath
        ? `http://localhost:4000/uploads/${em.profilePicturePath}`
        : 'http://localhost:4000/uploads/default-avatar.jpg',
    }
  }
}
