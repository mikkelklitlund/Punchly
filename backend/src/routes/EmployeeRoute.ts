import { Router } from 'express'
import { body, query } from 'express-validator'
import authMiddleware from '../middleware/authMiddleware.js'
import { IUserService } from '../interfaces/services/IUserService.js'
import authorizeRoles from '../middleware/authorizeRoleMiddleware.js'
import { Role } from 'shared'
import { UTCDateMini } from '@date-fns/utc'
import { isValid, parseISO } from 'date-fns'
import { checkValidationResult } from '../middleware/validationMiddleware.js'
import { EmployeeController } from '../controllers/employeeController.js'
import { upload } from '../middleware/uploadMiddleware.js'

function validateYYYYMMDD(value: string, field: string) {
  const parsed = parseISO(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isValid(parsed)) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date`)
  }
  return true
}

export function createEmployeeRoutes(controller: EmployeeController, userService: IUserService): Router {
  const router = Router()
  const adminManagerAuth = [authMiddleware, authorizeRoles(userService, Role.ADMIN, Role.MANAGER)]
  const checkinAuth = [authMiddleware, authorizeRoles(userService, Role.ADMIN, Role.COMPANY, Role.MANAGER)]
  const auth = authMiddleware

  router.post(
    '/',
    ...adminManagerAuth,
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
    checkValidationResult,
    controller.createEmployee
  )

  router.get(
    '/',
    auth,
    [
      query('company').isNumeric().withMessage('Valid company ID is required'),
      query('department').optional().isNumeric().withMessage('Valid department ID is required'),
      query('type').optional().isNumeric().withMessage('Valid type ID is required'),
    ],
    checkValidationResult,
    controller.getEmployeesByQueryParams
  )

  router.get('/:id', auth, controller.getEmployeeById)

  router.put(
    '/:id',
    ...adminManagerAuth,
    [
      body('name').optional().notEmpty().withMessage('Name is required if provided'),
      body('companyId').optional().isNumeric().withMessage('Valid company ID is required if provided'),
      body('departmentId').optional().isNumeric().withMessage('Valid department ID is required if provided'),
    ],
    checkValidationResult,
    controller.updateEmployee
  )

  router.delete('/:id', ...adminManagerAuth, controller.deleteEmployee)

  router.post('/:employeeId/checkin', ...checkinAuth, controller.employeeCheckin)
  router.post('/:employeeId/checkout', ...checkinAuth, controller.employeeCheckout)

  router.get(
    '/attendance-report',
    ...adminManagerAuth,
    [
      query('startDate')
        .notEmpty()
        .custom((v) => validateYYYYMMDD(v, 'startDate'))
        .customSanitizer((v) => new UTCDateMini(v)),
      query('endDate')
        .notEmpty()
        .custom((v) => validateYYYYMMDD(v, 'endDate'))
        .customSanitizer((v) => new UTCDateMini(v)),
      query('timezone').notEmpty(),
      query('departmentId').optional().isInt().toInt(),
    ],
    checkValidationResult,
    controller.generateAttendanceReport
  )

  router.get(
    '/:employeeId/attendance-records-last-30',
    ...adminManagerAuth,
    controller.getLast30AttendanceRecordsForEmployee
  )

  router.get(
    '/:employeeId/attendances',
    ...adminManagerAuth,
    [
      query('startDate').isISO8601().withMessage('startDate must be ISO date'),
      query('endDate').isISO8601().withMessage('endDate must be ISO date'),
    ],
    checkValidationResult,
    controller.getAttendanceRecordsForEmployee
  )

  router.post(
    '/attendance-records/:id',
    ...adminManagerAuth,
    [
      body('checkIn').isISO8601().withMessage('Check-in must be a valid ISO date string'),
      body('checkOut').isISO8601().withMessage('Check-out must be a valid ISO date string'),
    ],
    checkValidationResult,
    controller.createAttendanceRecord
  )

  router.put(
    '/attendance-records/:id',
    ...adminManagerAuth,
    [
      body('checkIn').optional().isISO8601().withMessage('Check-in must be a valid ISO date string'),
      body('checkOut').optional().isISO8601().withMessage('Check-out must be a valid ISO date string'),
      body('autoClosed').optional().isBoolean(),
    ],
    checkValidationResult,
    controller.updateAttendanceRecord
  )

  router.delete('/attendance-records/:id', ...adminManagerAuth, controller.deleteAttendanceRecord)

  router.post(
    '/:employeeId/absences',
    ...adminManagerAuth,
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
    checkValidationResult,
    controller.createAbsenceForEmployee
  )

  router.put(
    '/absences/:id',
    ...adminManagerAuth,
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
    checkValidationResult,
    controller.updateAbsence
  )

  router.delete('/absences/:id', ...adminManagerAuth, controller.deleteAbsence)

  router.get(
    '/:employeeId/absences',
    ...adminManagerAuth,
    [
      query('startDate').optional().isISO8601().withMessage('startDate must be ISO date'),
      query('endDate').optional().isISO8601().withMessage('endDate must be ISO date'),
    ],
    checkValidationResult,
    controller.getAbsencesForEmployee
  )

  router.post(
    '/upload-profile-picture/:id',
    authMiddleware,
    authorizeRoles(userService, Role.ADMIN, Role.MANAGER),
    upload.single('profilePicture'),
    controller.uploadProfilePicture
  )

  return router
}
