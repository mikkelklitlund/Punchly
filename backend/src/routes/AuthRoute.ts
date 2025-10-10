import { Router } from 'express'
import { body } from 'express-validator'
import authMiddleware from '../middleware/authMiddleware.js'
import { AuthController } from '../controllers/authController.js'
import { checkValidationResult } from '../middleware/validationMiddleware.js'
import { IUserService } from '../interfaces/services/IUserService.js'
import authorizeRoles from '../middleware/authorizeRoleMiddleware.js'
import { Role } from 'shared'

export function createAuthRoutes(controller: AuthController, userService: IUserService): Router {
  const router = Router()

  const adminAuth = [authMiddleware, authorizeRoles(userService, Role.ADMIN)]

  router.post(
    '/register',
    ...adminAuth,
    [
      body('email').isEmail().normalizeEmail().optional(),
      body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
        .withMessage('Password must be at least 8 characters long and contain both letters and numbers'),
      body('username').trim().isLength({ min: 3 }).escape(),
      body('shouldChangePassword').isBoolean(),
      body('role').isIn(['COMPANY', 'MANAGER', 'ADMIN']).withMessage('Invalid role provided'),
    ],
    checkValidationResult,
    controller.register
  )

  router.post(
    '/login',
    [body('username').trim().notEmpty(), body('password').notEmpty(), body('companyId').isNumeric()],
    checkValidationResult,
    controller.login
  )

  router.get('/profile', authMiddleware, controller.getProfile)

  router.post('/refresh', controller.refreshToken)

  router.post('/logout', authMiddleware, controller.logout)

  router.post('/companies-for-user', [body('username').trim().notEmpty()], controller.getCompaniesForUser)

  router.post(
    '/change-password',
    authMiddleware,
    [
      body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
        .withMessage('New password must be at least 8 characters long and contain both letters and numbers'),
    ],
    checkValidationResult,
    controller.changePassword
  )

  return router
}
