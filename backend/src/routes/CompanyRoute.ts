import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { Failure } from '../utils/Result'
import { ICompanyService } from '../interfaces/services/ICompanyService'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth'
import { IDepartmentService } from '../interfaces/services/IDepartmentService'

export class CompanyRoutes {
  public router: Router

  constructor(
    private readonly companyService: ICompanyService,
    private readonly employeeService: IEmployeeService,
    private readonly departmentServce: IDepartmentService
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
    this.router.get('/:companyId/departments', authMiddleware, this.getDepartmentsByCompanyId.bind(this))
    this.router.get('/all', this.getAllCompanies.bind(this))
    this.router.post(
      '/',
      authMiddleware,
      [
        body('name').notEmpty().withMessage('Name is required'),
        body('address').notEmpty().withMessage('Address is required'),
      ],
      this.createCompany.bind(this)
    )
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

    const result = await this.departmentServce.getDepartmentsByCompanyId(companyId)

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

    res.status(200).json({ company: result.value })
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
}
