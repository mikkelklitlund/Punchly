import { Router } from 'express'
import { body } from 'express-validator'
import authMiddleware from '../middleware/authMiddleware.js'
import authorizeRoles from '../middleware/authorizeRoleMiddleware.js'
import { Role } from 'shared'
import { IUserService } from '../interfaces/services/IUserService.js'
import { checkValidationResult } from '../middleware/validationMiddleware.js'
import { AdminController } from '../controllers/adminController.js'

export function createAdminRoutes(controller: AdminController, userService: IUserService): Router {
  const router = Router()

  const adminAuth = [authMiddleware, authorizeRoles(userService, Role.ADMIN)]

  router.get('/companies', ...adminAuth, controller.listCompanies)

  router.post(
    '/companies',
    ...adminAuth,
    [body('name').trim().notEmpty().withMessage('Company name is required')],
    checkValidationResult,
    controller.createCompany
  )

  router.patch(
    '/companies/:id',
    ...adminAuth,
    [body('name').optional().trim().isLength({ min: 1 }).withMessage('Name must not be empty')],
    checkValidationResult,
    controller.updateCompany
  )

  router.delete('/companies/:id', ...adminAuth, controller.deleteCompany)

  return router
}
