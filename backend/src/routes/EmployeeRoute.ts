import { Request, Response, Router } from 'express'
import { container } from '../inversify.config'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { body, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth'
import { Failure } from '../utils/Result'
import { CreateEmployee, Employee } from 'shared'
import { IUserService } from 'src/interfaces/services/IUserService'

const router = Router()
const employeeService = container.get<IEmployeeService>('IEmployeeService')
const userService = container.get<IUserService>('IUserService')

router.post(
  '/',
  authMiddleware(userService),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('companyId').isNumeric().withMessage('Valid company ID is required'),
    body('departmentId').isNumeric().withMessage('Valid department ID is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const newEmployee: CreateEmployee = req.body
    const result = await employeeService.createEmployee(newEmployee)

    if (result instanceof Failure) {
      res.status(500).json({ success: false, message: result.error.message })
      return
    }

    res.status(201).json({ success: true, employee: result.value })
  }
)

router.get('/:id', authMiddleware(userService), async (req: Request, res: Response) => {
  const employeeId = parseInt(req.params.id)
  const result = await employeeService.getEmployeeById(employeeId)

  if (result instanceof Failure) {
    res.status(404).json({ success: false, message: result.error.message })
    return
  }

  res.status(200).json({ success: true, employee: result.value })
})

router.put(
  '/:id',
  authMiddleware(userService),
  [
    body('name').optional().notEmpty().withMessage('Name is required if provided'),
    body('companyId').optional().isNumeric().withMessage('Valid company ID is required if provided'),
    body('departmentId').optional().isNumeric().withMessage('Valid department ID is required if provided'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const employeeId = parseInt(req.params.id)
    const employee: Partial<Employee> = req.body
    const result = await employeeService.updateEmployee(employeeId, employee)

    if (result instanceof Failure) {
      res.status(500).json({ success: false, message: result.error.message })
      return
    }

    res.status(200).json({ success: true, employee: result.value })
  }
)

router.delete('/:id', authMiddleware(userService), async (req: Request, res: Response) => {
  const employeeId = parseInt(req.params.id)
  const result = await employeeService.deleteEmployee(employeeId)

  if (result instanceof Failure) {
    res.status(500).json({ success: false, message: result.error.message })
    return
  }

  res.status(204).send()
})

export default router
