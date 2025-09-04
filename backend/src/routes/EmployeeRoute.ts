import { Request, Response, Router } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { body, query, validationResult } from 'express-validator'
import authMiddleware from '../middleware/Auth.js'
import { Failure, Result } from '../utils/Result.js'
import { CreateAbsenceRecordDTO, CreateEmployeeDTO, EmployeeDTO, Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import authorizeRoles from '../middleware/authorizeRole.js'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { UTCDateMini } from '@date-fns/utc'
import { isValid, parseISO } from 'date-fns'
import {
  fromCreateEmployeeDTO,
  fromPartialEmployeeDTO,
  toAbsenceRecordDTO,
  toAttendanceRecordDTO,
  toEmployeeDTO,
} from '../utils/mappers.js'
import { Employee } from '../types/index.js'

function validateYYYYMMDD(value: string, field: string) {
  const parsed = parseISO(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isValid(parsed)) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date`)
  }
  return true
}

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
    this.router.get(
      '/attendance-report',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        query('startDate')
          .notEmpty()
          .custom((v) => validateYYYYMMDD(v, 'startDate'))
          .customSanitizer((v) => new UTCDateMini(v)),

        query('endDate')
          .notEmpty()
          .custom((v) => validateYYYYMMDD(v, 'endDate'))
          .customSanitizer((v) => new UTCDateMini(v)),

        query('departmentId').optional().isInt().toInt(),
      ],
      this.generateAttendanceReport.bind(this)
    )

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
          .customSanitizer((v: string) => {
            return new UTCDateMini(v)
          }),
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

    this.router.post(
      '/:employeeId/checkin',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.COMPANY, Role.MANAGER),
      this.employeeCheckin.bind(this)
    )

    this.router.post(
      '/:employeeId/checkout',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.COMPANY, Role.MANAGER),
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
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('name').optional().notEmpty().withMessage('Name is required if provided'),
        body('companyId').optional().isNumeric().withMessage('Valid company ID is required if provided'),
        body('departmentId').optional().isNumeric().withMessage('Valid department ID is required if provided'),
      ],
      this.updateEmployee.bind(this)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      this.deleteEmployee.bind(this)
    )

    this.router.get(
      '/:employeeId/attendance-records-last-30',
      authMiddleware,
      authorizeRoles(this.userService, Role.MANAGER, Role.ADMIN),
      this.getLast30AttendanceRecordsForEmployee.bind(this)
    )

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

    this.router.delete(
      '/attendance-records/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      this.deleteAttendanceRecord.bind(this)
    )

    this.router.post(
      '/:employeeId/absences',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('startDate')
          .notEmpty()
          .custom((v) => validateYYYYMMDD(v, 'startDate'))
          .customSanitizer((v) => new UTCDateMini(v)),

        body('endDate')
          .notEmpty()
          .custom((v) => validateYYYYMMDD(v, 'endDate'))
          .customSanitizer((v) => new UTCDateMini(v)),
        body('absenceTypeId').isInt().toInt().withMessage('Valid absenceTypeId is required'),
      ],

      this.createAbsenceForEmployee.bind(this)
    )

    this.router.put(
      '/absences/:id',
      authMiddleware,
      authorizeRoles(this.userService, Role.ADMIN, Role.MANAGER),
      [
        body('startDate')
          .optional()
          .custom((v) => validateYYYYMMDD(v, 'startDate'))
          .customSanitizer((v) => new UTCDateMini(v)),

        body('endDate')
          .optional()
          .custom((v) => validateYYYYMMDD(v, 'endDate'))
          .customSanitizer((v) => new UTCDateMini(v)),
        body('absenceTypeId').optional().isInt().toInt(),
      ],
      this.updateAbsence.bind(this)
    )

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

  private async employeeCheckin(req: Request, res: Response) {
    const employeeId = parseInt(req.params.employeeId)
    const checkInResult = await this.attendanceService.checkInEmployee(employeeId)

    if (checkInResult instanceof Failure) {
      res.status(500).json({ message: checkInResult.error.message })
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

    res.status(200).json({ success: true })
  }

  private async createEmployee(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const newEmployee: CreateEmployeeDTO = req.body
    const result = await this.employeeService.createEmployee(fromCreateEmployeeDTO(newEmployee))

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ employee: toEmployeeDTO(result.value) })
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

    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  private async getEmployeeById(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.getEmployeeById(employeeId)

    if (result instanceof Failure) {
      res.status(404).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employee: toEmployeeDTO(result.value) })
  }

  private async updateEmployee(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const employeeId = parseInt(req.params.id)
    const employee: Partial<EmployeeDTO> = req.body
    const result = await this.employeeService.updateEmployee(employeeId, fromPartialEmployeeDTO(employee))

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employee: toEmployeeDTO(result.value) })
  }

  private async deleteEmployee(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.deleteEmployee(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send()
  }

  private async getLast30AttendanceRecordsForEmployee(req: Request, res: Response) {
    const employeeId = parseInt(req.params.employeeId)

    const result = await this.attendanceService.getLast30AttendanceRecords(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ records: result.value.map(toAttendanceRecordDTO) })
  }

  private async updateAttendanceRecord(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array() })
      return
    }

    const id = parseInt(req.params.id)
    const { checkIn, checkOut } = req.body

    const result = await this.attendanceService.updateAttendanceRecord(id, {
      checkIn: checkIn ? new UTCDateMini(checkIn) : undefined,
      checkOut: checkOut ? new UTCDateMini(checkOut) : undefined,
    })

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ record: toAttendanceRecordDTO(result.value) })
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

    const start = new UTCDateMini(startDate as string)
    const end = new UTCDateMini(endDate as string)

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

  private async createAbsenceForEmployee(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() })
    }

    const employeeId = parseInt(req.params.employeeId, 10)
    const { startDate, endDate, absenceTypeId } = req.body as CreateAbsenceRecordDTO

    const start = new UTCDateMini(startDate)
    const end = new UTCDateMini(endDate)

    const result = await this.absenceService.createAbsenceRecord({
      employeeId,
      startDate: start,
      endDate: end,
      absenceTypeId,
    })

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    res.status(201).json({ absenceRecord: toAbsenceRecordDTO(result.value) })
  }

  private async updateAbsence(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() })
    }

    const id = parseInt(req.params.id, 10)
    const { startDate, endDate, absenceTypeId } = req.body as {
      startDate?: string
      endDate?: string
      absenceTypeId?: number
    }

    const result = await this.absenceService.updateAbsenceRecord(id, {
      ...(startDate ? { startDate: new UTCDateMini(startDate) } : {}),
      ...(endDate ? { endDate: new UTCDateMini(endDate) } : {}),
      ...(typeof absenceTypeId === 'number' ? { absenceTypeId } : {}),
    })

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    res.status(200).json({ absenceRecord: toAbsenceRecordDTO(result.value) })
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
      const start = new UTCDateMini(startDate)
      const end = new UTCDateMini(endDate)
      result = await this.absenceService.getAbsenceRecordsByEmployeeIdAndRange(employeeId, start, end)
    } else {
      result = await this.absenceService.getAbsenceRecordsByEmployeeId(employeeId)
    }

    if (result instanceof Failure) {
      return res.status(500).json({ message: result.error.message })
    }

    res.status(200).json({ absences: result.value.map(toAbsenceRecordDTO) })
  }
}
