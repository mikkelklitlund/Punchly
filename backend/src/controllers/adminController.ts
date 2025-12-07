import { Request, Response } from 'express'
import { ICompanyService } from '../interfaces/services/ICompanyService.js'
import { Failure } from '../utils/Result.js'

export class AdminController {
  constructor(private companyService: ICompanyService) {}

  listCompanies = async (req: Request, res: Response) => {
    const userId = req.userId

    req.log?.debug({ userId }, 'Admin listing companies')

    if (!userId) {
      return res.status(400).json({ message: 'No user id provided, logout and back in.' })
    }

    const result = await this.companyService.getAllCompaniesByUser(userId)
    if (result instanceof Failure) {
      req.log?.warn({ error: result.error?.message, userId }, 'Failed to list companies')
      return res.status(400).json({ message: result.error?.message })
    }

    req.log?.debug({ count: result.value.length }, 'Successfully listed companies')
    return res.json(result.value)
  }

  createCompany = async (req: Request, res: Response) => {
    const { name } = req.body
    const userId = req.userId

    req.log?.info({ userId, companyName: name }, 'Admin attempting to create new company')

    if (!userId) {
      return res.status(400).json({ message: 'No user id provided, logout and back in.' })
    }

    const result = await this.companyService.createCompanyWithAdmin(userId, name)
    if (result instanceof Failure) {
      req.log?.warn(
        { error: result.error?.message, userId },
        'Failed to create company due to business rule or validation'
      )
      return res.status(400).json({ message: result.error?.message })
    }

    req.log?.info({ companyId: result.value.id }, 'Company created successfully')
    return res.status(201).json(result.value)
  }

  updateCompany = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id)
    const { name } = req.body

    req.log?.info({ companyId, newName: name }, 'Admin attempting to update company')

    const result = await this.companyService.updateCompany(companyId, { name })
    if (result instanceof Failure) {
      req.log?.warn({ error: result.error?.message, companyId }, 'Failed to update company')
      return res.status(400).json({ message: result.error?.message })
    }

    req.log?.info({ companyId }, 'Company updated successfully')
    return res.json(result.value)
  }

  deleteCompany = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id)

    req.log?.warn({ companyId }, 'Admin attempting to delete company')

    const result = await this.companyService.deleteCompany(companyId)
    if (result instanceof Failure) {
      req.log?.warn({ error: result.error?.message, companyId }, 'Failed to delete company')
      return res.status(400).json({ message: result.error?.message })
    }

    req.log?.info({ companyId }, 'Company deleted successfully')
    return res.status(204).send()
  }
}
