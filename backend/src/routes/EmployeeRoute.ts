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
  constructor(
    private readonly userService: IUserService,
    private readonly employeeService: IEmployeeService,
    private readonly attendanceService: IAttendanceService
  ) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /employees:
     *   post:
     *     summary: Create a new employee
     *     tags:
     *       - Employees
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
     *               - companyId
     *               - departmentId
     *             properties:
     *               name:
     *                 type: string
     *               companyId:
     *                 type: integer
     *               departmentId:
     *                 type: integer
     *     responses:
     *       201:
     *         description: Employee created successfully
     *       400:
     *         description: Validation failed
     *       500:
     *         description: Server error
     */
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

    /**
     * @swagger
     * /employees/{employeeId}/checkin:
     *   post:
     *     summary: Employee check-in
     *     tags:
     *       - Attendance
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: employeeId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Check-in successful
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/:employeeId/checkin',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.COMPANY, Role.MANAGER),
      this.employeeCheckin.bind(this)
    )

    /**
     * @swagger
     * /employees/{employeeId}/checkout:
     *   post:
     *     summary: Employee check-out
     *     tags:
     *       - Attendance
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: employeeId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Check-out successful
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/:employeeId/checkout',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.COMPANY, Role.MANAGER),
      this.employeeCheckout.bind(this)
    )

    /**
     * @swagger
     * /employees/{id}:
     *   get:
     *     summary: Get an employee by ID
     *     tags:
     *       - Employees
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Employee retrieved successfully
     *       404:
     *         description: Employee not found
     */
    this.router.get('/:id', authMiddleware, this.getEmployeeById.bind(this))

    /**
     * @swagger
     * /employees:
     *   get:
     *     summary: Get employees by company and optional department/type
     *     tags:
     *       - Employees
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: company
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: department
     *         schema:
     *           type: integer
     *       - in: query
     *         name: type
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Employees retrieved successfully
     *       400:
     *         description: Invalid query parameters
     *       500:
     *         description: Server error
     */
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

    /**
     * @swagger
     * /employees/{id}:
     *   put:
     *     summary: Update an existing employee
     *     tags:
     *       - Employees
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               companyId:
     *                 type: integer
     *               departmentId:
     *                 type: integer
     *     responses:
     *       200:
     *         description: Employee updated successfully
     *       400:
     *         description: Validation error
     *       500:
     *         description: Server error
     */
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

    /**
     * @swagger
     * /employees/{id}:
     *   delete:
     *     summary: Delete an employee
     *     tags:
     *       - Employees
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Employee deleted successfully
     *       500:
     *         description: Server error
     */
    this.router.delete('/:id', authMiddleware, authorizeRoles(Role.ADMIN, Role.MANAGER), this.deleteEmployee.bind(this))

    /**
     * @swagger
     * /employees/{employeeId}/attendance-records-last-30:
     *   get:
     *     summary: Get the last 30 attendance records for an employee
     *     tags:
     *       - Attendance
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: employeeId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Attendance records retrieved
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/:employeeId/attendance-records-last-30',
      authMiddleware,
      authorizeRoles(Role.MANAGER, Role.ADMIN),
      this.getLast30AttendanceRecordsForEmployee.bind(this)
    )

    /**
     * @swagger
     * /attendance-records/{id}:
     *   put:
     *     summary: Update an attendance record (check-in / check-out)
     *     tags:
     *       - Attendance
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               checkIn:
     *                 type: string
     *                 format: date-time
     *               checkOut:
     *                 type: string
     *                 format: date-time
     *     responses:
     *       200:
     *         description: Record updated successfully
     *       400:
     *         description: Invalid input
     *       404:
     *         description: Record not found
     *       500:
     *         description: Server error
     */
    this.router.put(
      '/attendance-records/:id',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.MANAGER),
      [
        body('checkIn').optional().isISO8601().withMessage('Check-in must be a valid ISO date string'),
        body('checkOut').optional().isISO8601().withMessage('Check-out must be a valid ISO date string'),
        body('autoClosed').optional().isBoolean(),
      ],
      this.updateAttendanceRecord.bind(this)
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

  private async getLast30AttendanceRecordsForEmployee(req: Request, res: Response) {
    const employeeId = parseInt(req.params.employeeId)

    const result = await this.attendanceService.getLast30AttendanceRecords(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ records: result.value })
  }

  private async updateAttendanceRecord(req: AuthenticatedRequest, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.MANAGER]))) return

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const id = parseInt(req.params.id)
    const { checkIn, checkOut, autoClosed } = req.body

    const result = await this.attendanceService.updateAttendanceRecord(id, {
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      autoClosed,
    })

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ record: result.value })
  }
}
