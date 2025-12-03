import { Request, Response } from 'express'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { Failure } from '../utils/Result.js'

export class AdminController {
  constructor(private companyService: ICompanyService) {}

  listCompanies = async (req: Request, res: Response) => {
    const userId = req.userId

    if (!userId) {
      return res.status(400).json({ message: 'No user id provided, logout and back in.' })
    }

    const result = await this.companyService.getAllCompaniesByUser(userId)
    if (result instanceof Failure) {
      req.log?.warn({ error: result.error?.message }, 'Failed to list companies')
      return res.status(400).json({ message: result.error?.message })
    }

    return res.json(result.value)
  }

  createCompany = async (req: Request, res: Response) => {
    const { name } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(400).json({ message: 'No user id provided, logout and back in.' })
    }

    const result = await this.companyService.createCompanyWithAdmin(userId, name)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error?.message }, 'Failed to create company')
      return res.status(400).json({ message: result.error?.message })
    }

    return res.status(201).json(result.value)
  }

  updateCompany = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id)
    const { name } = req.body

    const result = await this.companyService.updateCompany(companyId, { name })
    if (result instanceof Failure) {
      req.log?.warn({ error: result.error?.message }, 'Failed to update company')
      return res.status(400).json({ message: result.error?.message })
    }

    return res.json(result.value)
  }

  deleteCompany = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id)

    const result = await this.companyService.deleteCompany(companyId)
    if (result instanceof Failure) {
      req.log?.error({ error: result.error?.message }, 'Failed to delete company')
      return res.status(400).json({ message: result.error?.message })
    }

    return res.status(204).send()
  }
}
