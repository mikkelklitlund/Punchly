import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { body, query, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth.js'
import { Failure, Result } from '../utils/Result.js'
import { CreateEmployee, Employee, Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import authorizeRoles from '../middleware/authorizeRole.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest.js'

export class EmployeeRoutes {
  public router: Router
  private clients: { id: number; companyId: number; departmentId: number; res: Response }[] = []
  private clientId = 0
  constructor(
    private readonly userService: IUserService,
    private readonly employeeService: IEmployeeService,
    private readonly attendanceService: IAttendanceService
  ) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.MANAGER),
      [
        body('name').notEmpty().withMessage('Name is required'),
        body('companyId').isNumeric().withMessage('Valid company ID is required'),
        body('departmentId').isNumeric().withMessage('Valid department ID is required'),
      ],
      this.createEmployee.bind(this)
    )

    this.router.post(
      '/:employeeId/checkin',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.COMPANY, Role.MANAGER),
      this.employeeCheckin.bind(this)
    )
    this.router.post(
      '/:employeeId/checkout',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.COMPANY, Role.MANAGER),
      this.employeeCheckout.bind(this)
    )

    this.router.get('/:id', authMiddleware, this.getEmployeeById.bind(this))

    this.router.get(
      '/',
      authMiddleware,
      [
        query('company').isNumeric().withMessage('Valid company ID is required'),
        query('department').optional().isNumeric().withMessage('Valid department ID is required'),
        query('type').optional().isNumeric().withMessage('Valid type ID is required'),
      ],
      this.getEmployeesByQueryParams.bind(this)
    )

    this.router.put(
      '/:id',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.MANAGER),
      [
        body('name').optional().notEmpty().withMessage('Name is required if provided'),
        body('companyId').optional().isNumeric().withMessage('Valid company ID is required if provided'),
        body('departmentId').optional().isNumeric().withMessage('Valid department ID is required if provided'),
      ],
      this.updateEmployee.bind(this)
    )

    this.router.delete('/:id', authMiddleware, authorizeRoles(Role.ADMIN, Role.MANAGER), this.deleteEmployee.bind(this))
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

  private async employeeCheckin(req: AuthenticatedRequest, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.COMPANY, Role.MANAGER]))) return

    const employeeId = parseInt(req.params.employeeId)
    const checkInResult = await this.attendanceService.checkInEmployee(employeeId)

    if (checkInResult instanceof Failure) {
      res.status(500).json({ message: checkInResult.error.message })
      return
    }

    const employeeResult = await this.employeeService.getEmployeeById(employeeId)
    if (employeeResult instanceof Failure) {
      res.status(500).json({ message: employeeResult.error.message })
      return
    }

    res.status(200).json({ success: true })
  }

  private async employeeCheckout(req: AuthenticatedRequest, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.COMPANY, Role.MANAGER]))) return

    const employeeId = parseInt(req.params.employeeId)
    const checkOutResult = await this.attendanceService.checkOutEmployee(employeeId)

    if (checkOutResult instanceof Failure) {
      res.status(500).json({ message: checkOutResult.error.message })
      return
    }

    const employeeResult = await this.employeeService.getEmployeeById(employeeId)
    if (employeeResult instanceof Failure) {
      res.status(500).json({ message: employeeResult.error.message })
      return
    }

    res.status(200).json({ success: true })
  }

  private async createEmployee(req: Request, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.MANAGER]))) return
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const newEmployee: CreateEmployee = req.body
    const result = await this.employeeService.createEmployee(newEmployee)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ employee: result.value })
  }

  private async getEmployeesByQueryParams(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const companyId = parseInt(req.query.company as string)
    const departmentId = req.query.department ? parseInt(req.query.department as string) : null
    const employeeType = req.query.type ? parseInt(req.query.type as string) : null

    let result: Result<Employee[], Error>
    if (departmentId) {
      result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    } else {
      result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    }

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    if (employeeType) {
      result.value = result.value.filter((em) => em.employeeTypeId === employeeType)
    }

    res.status(200).json({ employees: result.value })
  }

  private async getEmployeeById(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.getEmployeeById(employeeId)

    if (result instanceof Failure) {
      res.status(404).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employee: result.value })
  }

  private async updateEmployee(req: AuthenticatedRequest, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.MANAGER]))) return
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const employeeId = parseInt(req.params.id)
    const employee: Partial<Employee> = req.body
    const result = await this.employeeService.updateEmployee(employeeId, employee)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employee: result.value })
  }

  private async deleteEmployee(req: AuthenticatedRequest, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.COMPANY, Role.MANAGER]))) return
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.deleteEmployee(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send({ employeeDeleted: result.value })
  }
}
