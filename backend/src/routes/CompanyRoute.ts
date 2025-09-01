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
    /**
     * @swagger
     * /companies/{companyId}/employees:
     *   get:
     *     summary: Get all employees by company ID
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of employees
     */
    this.router.get('/:companyId/employees', authMiddleware, this.getAllEmployeesByCompany.bind(this))

    /**
     * @swagger
     * /companies/{companyId}/{departmentId}/employees:
     *   get:
     *     summary: Get all employees by company and department ID
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: departmentId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of employees
     */
    this.router.get(
      '/:companyId/:departmentId/employees',
      authMiddleware,
      this.getAllEmployeesByCompanyAndDepartment.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/{departmentId}/simple-employees:
     *   get:
     *     summary: Get simplified employee list for a company and department
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: departmentId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of simplified employees
     */
    this.router.get(
      '/:companyId/:departmentId/simple-employees',
      authMiddleware,
      this.getAllSimpleEmployeesByCompanyAndDepartment.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/managers:
     *   get:
     *     summary: Get all managers for a company (Admin only)
     *     tags:
     *       - Companies
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of managers
     *       403:
     *         description: Unauthorized
     */
    this.router.get(
      '/:companyId/managers',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      this.getAllManagers.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/departments:
     *   get:
     *     summary: Get departments by company ID
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of departments
     */
    this.router.get('/:companyId/departments', authMiddleware, this.getDepartmentsByCompanyId.bind(this))

    /**
     * @swagger
     * /companies/{companyId}/simple-employees:
     *   get:
     *     summary: Get simplified employee list for a company
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of simplified employees
     */
    this.router.get('/:companyId/simple-employees', authMiddleware, this.getSimpleEmployees.bind(this))

    /**
     * @swagger
     * /companies/all:
     *   get:
     *     summary: Get all companies
     *     tags:
     *       - Companies
     *     responses:
     *       200:
     *         description: A list of companies
     */
    this.router.get('/all', this.getAllCompanies.bind(this))

    /**
     * @swagger
     * /companies:
     *   post:
     *     summary: Create a new company
     *     tags:
     *       - Companies
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - address
     *             properties:
     *               name:
     *                 type: string
     *               address:
     *                 type: string
     *     responses:
     *       201:
     *         description: Company created successfully
     *       400:
     *         description: Validation error
     *       500:
     *         description: Server error
     */
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

    /**
     * @swagger
     * /companies/{companyId}/employee-types:
     *   get:
     *     summary: Get employee types by company ID
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A list of employee types
     */
    this.router.get('/:companyId/employee-types', authMiddleware, this.getEmployeeTypesByCompany.bind(this))

    /**
     * @swagger
     * /companies/{companyId}/departments:
     *   post:
     *     summary: Create department (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string, maxLength: 100 }
     *     responses:
     *       201: { description: Created }
     *       400: { description: Validation error }
     *       409: { description: Already exists }
     */
    this.router.post(
      '/:companyId/departments',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.createDepartment.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/departments/{id}:
     *   patch:
     *     summary: Rename department (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string, maxLength: 100 }
     *     responses:
     *       200: { description: Updated }
     *       400: { description: Validation error }
     *       404: { description: Not found }
     *       409: { description: Name already exists }
     */
    this.router.patch(
      '/:companyId/departments/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.renameDepartment.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/departments/{id}:
     *   delete:
     *     summary: Delete department (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       204: { description: Deleted }
     *       404: { description: Not found }
     *       409: { description: Cannot delete: in use }
     */
    this.router.delete(
      '/:companyId/departments/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [],
      this.deleteDepartment.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/employee-types:
     *   post:
     *     summary: Create employee type (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string, maxLength: 100 }
     *     responses:
     *       201: { description: Created }
     *       400: { description: Validation error }
     */
    this.router.post(
      '/:companyId/employee-types',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.createEmployeeType.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/employee-types/{id}:
     *   patch:
     *     summary: Rename employee type (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string, maxLength: 100 }
     *     responses:
     *       200: { description: Updated }
     *       400: { description: Validation error }
     *       404: { description: Not found }
     */
    this.router.patch(
      '/:companyId/employee-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.renameEmployeeType.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/employee-types/{id}:
     *   delete:
     *     summary: Delete employee type (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       204: { description: Deleted }
     *       404: { description: Not found }
     */
    this.router.delete(
      '/:companyId/employee-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      this.deleteEmployeeType.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/absence-types:
     *   get:
     *     summary: Get absence types by company ID
     *     tags: [Companies]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200: { description: A list of absence types }
     */
    this.router.get('/:companyId/absence-types', authMiddleware, this.getAbsenceTypesByCompany.bind(this))

    /**
     * @swagger
     * /companies/{companyId}/absence-types:
     *   post:
     *     summary: Create absence type (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string, maxLength: 100 }
     *     responses:
     *       201: { description: Created }
     *       400: { description: Validation error }
     *       409: { description: Already exists }
     */
    this.router.post(
      '/:companyId/absence-types',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.createAbsenceType.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/absence-types/{id}:
     *   patch:
     *     summary: Rename absence type (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string, maxLength: 100 }
     *     responses:
     *       200: { description: Updated }
     *       400: { description: Validation error }
     *       404: { description: Not found }
     */
    this.router.patch(
      '/:companyId/absence-types/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN),
      [body('name').trim().notEmpty().isLength({ max: 100 })],
      this.renameAbsenceType.bind(this)
    )

    /**
     * @swagger
     * /companies/{companyId}/absence-types/{id}:
     *   delete:
     *     summary: Delete absence type (ADMIN)
     *     tags: [Companies]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema: { type: integer }
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       204: { description: Deleted }
     *       404: { description: Not found }
     *       409: { description: Cannot delete: in use }
     */
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
      managers: result.value,
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
    res.status(200).json({ employees: result.value })
  }

  private async getSimpleEmployees(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)
    const result = await this.employeeService.getSimpleEmployees(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }
    res.status(200).json({ employees: result.value })
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

  private async getEmployeeTypesByCompany(req: Request, res: Response) {
    const companyId = parseInt(req.params.companyId)

    const result = await this.employeeTypeService.getEmployeeTypesByCompanyId(companyId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employeeTypes: result.value })
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

    return res.status(201).json({ department: result.value })
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

    return res.status(200).json({ department: result.value })
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

    return res.status(201).json({ employeeType: result.value })
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

    return res.status(200).json({ employeeType: result.value })
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

    return res.status(200).json({ absenceTypes: result.value })
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
    return res.status(201).json({ absenceType: result.value })
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

    return res.status(200).json({ absenceType: result.value })
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
