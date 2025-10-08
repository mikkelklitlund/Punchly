import { Router } from 'express'
import { body } from 'express-validator'
import authMiddleware from '../middleware/authMiddleware.js'
import authorizeRoles from '../middleware/authorizeRoleMiddleware.js'
import { Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { checkValidationResult } from '../middleware/validationMiddleware.js'
import { CompanyController } from '../controllers/companyController.js'

export function createCompanyRoutes(controller: CompanyController, userService: IUserService): Router {
  const router = Router()

  const adminAuth = [authMiddleware, authorizeRoles(userService, Role.ADMIN)]
  const auth = authMiddleware

  router.get('/all', controller.getAllCompanies)

  router.post(
    '/',
    ...adminAuth,
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('address').notEmpty().withMessage('Address is required'),
    ],
    checkValidationResult,
    controller.createCompany
  )

  router.get('/:companyId/employees', auth, controller.getAllEmployeesByCompany)
  router.get('/:companyId/:departmentId/employees', auth, controller.getAllEmployeesByCompanyAndDepartment)
  router.get('/:companyId/:departmentId/simple-employees', auth, controller.getAllSimpleEmployeesByCompanyAndDepartment)
  router.get('/:companyId/simple-employees', auth, controller.getSimpleEmployees)
  router.get('/:companyId/managers', auth, authorizeRoles(userService, Role.ADMIN), controller.getAllManagers)

  router.get('/:companyId/departments', auth, controller.getDepartmentsByCompanyId)
  router.post(
    '/:companyId/departments',
    ...adminAuth,
    [body('name').trim().notEmpty().isLength({ max: 100 })],
    checkValidationResult,
    controller.createDepartment
  )
  router.patch(
    '/:companyId/departments/:id',
    ...adminAuth,
    [body('name').trim().notEmpty().isLength({ max: 100 })],
    checkValidationResult,
    controller.renameDepartment
  )
  router.delete('/:companyId/departments/:id', ...adminAuth, controller.deleteDepartment)

  router.get('/:companyId/employee-types', auth, controller.getEmployeeTypesByCompany)
  router.post(
    '/:companyId/employee-types',
    ...adminAuth,
    [body('name').trim().notEmpty().isLength({ max: 100 })],
    checkValidationResult,
    controller.createEmployeeType
  )
  router.patch(
    '/:companyId/employee-types/:id',
    ...adminAuth,
    [body('name').trim().notEmpty().isLength({ max: 100 })],
    checkValidationResult,
    controller.renameEmployeeType
  )
  router.delete('/:companyId/employee-types/:id', ...adminAuth, controller.deleteEmployeeType)

  router.get('/:companyId/absence-types', auth, controller.getAbsenceTypesByCompany)
  router.post(
    '/:companyId/absence-types',
    ...adminAuth,
    [body('name').trim().notEmpty().isLength({ max: 100 })],
    checkValidationResult,
    controller.createAbsenceType
  )
  router.patch(
    '/:companyId/absence-types/:id',
    ...adminAuth,
    [body('name').trim().notEmpty().isLength({ max: 100 })],
    checkValidationResult,
    controller.renameAbsenceType
  )
  router.delete('/:companyId/absence-types/:id', ...adminAuth, controller.deleteAbsenceType)

  return router
}
