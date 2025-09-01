import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { body, query, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth.js'
import { Failure, Result } from '../utils/Result.js'
import { CreateEmployee, Employee, Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import authorizeRoles from '../middleware/authorizeRole.js'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'

export class EmployeeRoutes {
  public router: Router
  constructor(
    private readonly userService: IUserService,
    private readonly employeeService: IEmployeeService,
    private readonly attendanceService: IAttendanceService,
    private readonly absenceService: IAbsenceService
  ) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /employees/attendance-report:
     *   get:
     *     summary: Generate and download an employee attendance Excel report
     *     tags:
     *       - Employees
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: endDate
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: departmentId
     *         required: false
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Excel report generated successfully
     *         content:
     *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
     *             schema:
     *               type: string
     *               format: binary
     *       400:
     *         description: Validation error
     *       500:
     *         description: Server error
     */
    this.router.get(
      '/attendance-report',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      this.generateAttendanceReport.bind(this)
    )

    /**
     * @swagger
     * /employees:
     *   post:
     *     summary: Create a new employee
     *     tags: [Employees]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, companyId, departmentId, employeeTypeId, address, city, birthdate]
     *             properties:
     *               name:            { type: string }
     *               companyId:       { type: integer }
     *               departmentId:    { type: integer }
     *               employeeTypeId:  { type: integer }
     *               address:         { type: string }
     *               city:            { type: string }
     *               birthdate:
     *                 type: string
     *                 format: date        # e.g. "2000-10-11"
     *               monthlySalary:   { type: number, minimum: 0 }
     *               hourlySalary:    { type: number, minimum: 0 }
     *               checkedIn:       { type: boolean }
     *     responses:
     *       201: { description: Employee created successfully }
     *       400: { description: Validation failed }
     *       500: { description: Server error }
     */
    this.router.post(
      '/',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('companyId').isInt().toInt().withMessage('Valid company ID is required'),
        body('departmentId').isInt().toInt().withMessage('Valid department ID is required'),
        body('employeeTypeId').isInt().toInt().withMessage('Valid employee type ID is required'),
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('address').trim().notEmpty(),
        body('city').trim().notEmpty(),
        body('monthlySalary').optional({ nullable: true }).isFloat({ gt: 0 }).toFloat(),
        body('hourlySalary').optional({ nullable: true }).isFloat({ gt: 0 }).toFloat(),
        body('birthdate')
          .notEmpty()
          .isISO8601()
          .withMessage('birthdate must be an ISO date')
          .customSanitizer((v: string) => (v.length === 10 ? new Date(v + 'T00:00:00Z') : new Date(v))),
        body('checkedIn').optional({ nullable: true }).isBoolean().toBoolean(),
        body().custom((value) => {
          const hasMonthly = typeof value.monthlySalary === 'number' && value.monthlySalary > 0
          const hasHourly = typeof value.hourlySalary === 'number' && value.hourlySalary > 0
          if (hasMonthly && hasHourly) throw new Error('Provide either monthlySalary OR hourlySalary, not both')
          return true
        }),
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
     *       200: { description: Check-in successful }
     */
    this.router.post(
      '/:employeeId/checkin',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.COMPANY, Role.MANAGER),
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
     *       200: { description: Check-out successful }
     */
    this.router.post(
      '/:employeeId/checkout',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.COMPANY, Role.MANAGER),
      this.employeeCheckout.bind(this)
    )

    /**
     * @swagger
     * /employees/{id}:
     *   get:
     *     summary: Get an employee by ID
     *     tags: [Employees]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200: { description: Employee retrieved successfully }
     *       404: { description: Employee not found }
     */
    this.router.get('/:id', authMiddleware, this.getEmployeeById.bind(this))

    /**
     * @swagger
     * /employees:
     *   get:
     *     summary: Get employees by company and optional department/type
     *     tags: [Employees]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: query
     *         name: company
     *         required: true
     *         schema: { type: integer }
     *       - in: query
     *         name: department
     *         schema: { type: integer }
     *       - in: query
     *         name: type
     *         schema: { type: integer }
     *     responses:
     *       200: { description: Employees retrieved successfully }
     *       400: { description: Invalid query parameters }
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
     *     tags: [Employees]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200: { description: Employee updated successfully }
     *       400: { description: Validation error }
     */
    this.router.put(
      '/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
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
     *     tags: [Employees]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       204: { description: Employee deleted successfully }
     */
    this.router.delete(
      '/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      this.deleteEmployee.bind(this)
    )

    /**
     * @swagger
     * /employees/{employeeId}/attendance-records-last-30:
     *   get:
     *     summary: Get the last 30 attendance records for an employee
     *     tags: [Attendance]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: employeeId
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200: { description: Attendance records retrieved }
     */
    this.router.get(
      '/:employeeId/attendance-records-last-30',
      authMiddleware,
      authorizeRoles(this.userService, Role.MANAGER, Role.ADMIN),
      this.getLast30AttendanceRecordsForEmployee.bind(this)
    )

    /**
     * @swagger
     * /employees/attendance-records/{id}:
     *   put:
     *     summary: Update an attendance record
     *     tags: [Attendance]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200: { description: Record updated successfully }
     *       400: { description: Invalid input }
     *       404: { description: Record not found }
     */
    this.router.put(
      '/attendance-records/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('checkIn').optional().isISO8601().withMessage('Check-in must be a valid ISO date string'),
        body('checkOut').optional().isISO8601().withMessage('Check-out must be a valid ISO date string'),
        body('autoClosed').optional().isBoolean(),
      ],
      this.updateAttendanceRecord.bind(this)
    )

    /**
     * @swagger
     * /employees/attendance-records/{id}:
     *   delete:
     *     summary: Delete an attendance record
     *     tags: [Attendance]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       204: { description: Record deleted successfully }
     *       404: { description: Record not found }
     */
    this.router.delete(
      '/attendance-records/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      this.deleteAttendanceRecord.bind(this)
    )

    // ---------------------- ABSENCES (NEW) ----------------------

    /**
     * @swagger
     * /employees/{employeeId}/absences:
     *   post:
     *     summary: Create an absence record for an employee
     *     tags: [Absences]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: employeeId
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [startDate, endDate, absenceTypeId]
     *             properties:
     *               startDate: { type: string, format: date }
     *               endDate:   { type: string, format: date }
     *               absenceTypeId: { type: integer }
     *     responses:
     *       201: { description: Absence created }
     *       400: { description: Validation error }
     */
    this.router.post(
      '/:employeeId/absences',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('startDate').notEmpty().isISO8601().withMessage('startDate must be an ISO date'),
        body('endDate').notEmpty().isISO8601().withMessage('endDate must be an ISO date'),
        body('absenceTypeId').isInt().toInt().withMessage('Valid absenceTypeId is required'),
      ],
      this.createAbsenceForEmployee.bind(this)
    )

    /**
     * @swagger
     * /employees/absences/{id}:
     *   put:
     *     summary: Update an absence record
     *     tags: [Absences]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
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
     *             properties:
     *               startDate: { type: string, format: date }
     *               endDate:   { type: string, format: date }
     *               absenceTypeId: { type: integer }
     *     responses:
     *       200: { description: Absence updated }
     *       400: { description: Validation error }
     *       404: { description: Not found }
     */
    this.router.put(
      '/absences/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('startDate').optional().isISO8601().withMessage('startDate must be an ISO date'),
        body('endDate').optional().isISO8601().withMessage('endDate must be an ISO date'),
        body('absenceTypeId').optional().isInt().toInt(),
      ],
      this.updateAbsence.bind(this)
    )

    /**
     * @swagger
     * /employees/absences/{id}:
     *   delete:
     *     summary: Delete an absence record
     *     tags: [Absences]
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       204: { description: Absence deleted }
     *       404: { description: Not found }
     */
    this.router.delete(
      '/absences/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      this.deleteAbsence.bind(this)
    )

    this.router.get(
      '/:employeeId/absences',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        query('startDate').optional().isISO8601().withMessage('startDate must be ISO date'),
        query('endDate').optional().isISO8601().withMessage('endDate must be ISO date'),
      ],
      this.getAbsencesForEmployee.bind(this)
    )
  }

  // ---------------- Handlers ----------------

  private async employeeCheckin(req: Request, res: Response) {
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

  private async employeeCheckout(req: Request, res: Response) {
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

  private async updateEmployee(req: Request, res: Response) {
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

  private async deleteEmployee(req: Request, res: Response) {
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

  private async updateAttendanceRecord(req: Request, res: Response) {
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

  private async deleteAttendanceRecord(req: Request, res: Response) {
    const id = parseInt(req.params.id)

    const result = await this.attendanceService.deleteAttendanceRecord(id)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send()
  }

  private async generateAttendanceReport(req: Request, res: Response) {
    const { startDate, endDate, departmentId } = req.query
    if (!req.companyId) {
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }
    const companyId = parseInt(req.companyId)

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'startDate and endDate are required query parameters' })
      return
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    const deptId = departmentId ? parseInt(departmentId as string, 10) : undefined

    const result = await this.attendanceService.generateEmployeeAttendanceReport(start, end, companyId, deptId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=employee-attendance-report.xlsx')
    res.send(result.value)
  }

  // ---------------- Absence Handlers (NEW) ----------------

  private async createAbsenceForEmployee(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const employeeId = parseInt(req.params.employeeId, 10)
    const { startDate, endDate, absenceTypeId } = req.body as {
      startDate: string
      endDate: string
      absenceTypeId: number
    }

    const result = await this.absenceService.createAbsenceRecord({
      employeeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      absenceTypeId,
    })

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ absenceRecord: result.value })
  }

  private async updateAbsence(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const id = parseInt(req.params.id, 10)
    const { startDate, endDate, absenceTypeId } = req.body as {
      startDate?: string
      endDate?: string
      absenceTypeId?: number
    }

    const result = await this.absenceService.updateAbsenceRecord(id, {
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(typeof absenceTypeId === 'number' ? { absenceTypeId } : {}),
    })

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ absenceRecord: result.value })
  }

  private async deleteAbsence(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10)

    const result = await this.absenceService.deleteAbsenceRecord(id)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send()
  }

  private async getAbsencesForEmployee(req: Request, res: Response) {
    const employeeId = parseInt(req.params.employeeId, 10)
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string }

    let result
    if (startDate && endDate) {
      result = await this.absenceService.getAbsenceRecordsByEmployeeIdAndRange(
        employeeId,
        new Date(startDate),
        new Date(endDate)
      )
    } else {
      result = await this.absenceService.getAbsenceRecordsByEmployeeId(employeeId)
    }

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ absences: result.value })
  }
}
