import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth'
import { Failure } from '../utils/Result'
import { CreateEmployee, Employee } from 'shared'
import { IUserService } from 'src/interfaces/services/IUserService'

export class EmployeeRoutes {
  public router: Router
  constructor(
    private readonly userService: IUserService,
    private readonly employeeService: IEmployeeService
  ) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      authMiddleware(this.userService),
      [
        body('name').notEmpty().withMessage('Name is required'),
        body('companyId').isNumeric().withMessage('Valid company ID is required'),
        body('departmentId').isNumeric().withMessage('Valid department ID is required'),
      ],
      this.createEmployee.bind(this)
    )

    this.router.get('/:id', authMiddleware(this.userService), this.getEmployeeById.bind(this))

    this.router.put(
      '/:id',
      authMiddleware(this.userService),
      [
        body('name').optional().notEmpty().withMessage('Name is required if provided'),
        body('companyId').optional().isNumeric().withMessage('Valid company ID is required if provided'),
        body('departmentId').optional().isNumeric().withMessage('Valid department ID is required if provided'),
      ],
      this.updateEmployee.bind(this)
    )

    this.router.delete('/:id', authMiddleware(this.userService), this.deleteEmployee.bind(this))
  }

  private async createEmployee(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const newEmployee: CreateEmployee = req.body
    const result = await this.employeeService.createEmployee(newEmployee)

    if (result instanceof Failure) {
      res.status(500).json({ success: false, message: result.error.message })
      return
    }

    res.status(201).json({ success: true, employee: result.value })
  }

  private async getEmployeeById(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.getEmployeeById(employeeId)

    if (result instanceof Failure) {
      res.status(404).json({ success: false, message: result.error.message })
      return
    }

    res.status(200).json({ success: true, employee: result.value })
  }

  private async updateEmployee(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const employeeId = parseInt(req.params.id)
    const employee: Partial<Employee> = req.body
    const result = await this.employeeService.updateEmployee(employeeId, employee)

    if (result instanceof Failure) {
      res.status(500).json({ success: false, message: result.error.message })
      return
    }

    res.status(200).json({ success: true, employee: result.value })
  }

  private async deleteEmployee(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.deleteEmployee(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ success: false, message: result.error.message })
      return
    }

    res.status(204).send()
  }
}
