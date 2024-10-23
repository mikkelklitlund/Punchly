import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { Failure } from '../utils/Result'

export class CompanyRoutes {
  public router: Router

  constructor(private readonly employeeService: IEmployeeService) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get('/:companyId/employees', this.getAllEmployeesByCompany.bind(this))
    // Other company routes can go here
  }

  private async getAllEmployeesByCompany(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const employees = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    if (employees instanceof Failure) {
      res.status(500).json({ error: 'An error occurred while fetching employees.' })
      return
    }
    res.status(200).json({ employees })
  }
}
