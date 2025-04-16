import { Router, Response } from 'express'
import { upload } from '../middleware/Upload.js'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { Failure } from '../utils/Result.js'
import authMiddleware from '../middleware/Auth.js'
import authorizeRoles from '../middleware/authorizeRole.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest.js'
import { IUserService } from '../interfaces/services/IUserService.js'
import { Role } from 'shared'

export class EmployeePictureRoutes {
  public router: Router

  constructor(
    private readonly employeeService: IEmployeeService,
    private readonly userService: IUserService
  ) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /employees/upload-profile-picture/{id}:
     *   post:
     *     summary: Upload or update an employee's profile picture
     *     tags:
     *       - Employees
     *     security:
     *       - bearerAuth: []
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: formData
     *         name: profilePicture
     *         type: file
     *         required: true
     *         description: The image file to upload
     *     responses:
     *       200:
     *         description: Profile picture updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 profilePictureUrl:
     *                   type: string
     *                 employee:
     *                   type: object
     *       400:
     *         description: Invalid request or missing image
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     *       500:
     *         description: Server error
     */
    this.router.post(
      '/upload-profile-picture/:id',
      authMiddleware,
      authorizeRoles(Role.ADMIN, Role.MANAGER),
      upload.single('profilePicture'),
      this.uploadProfilePicture.bind(this)
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

  private async uploadProfilePicture(req: AuthenticatedRequest, res: Response) {
    if (!(await this.validateUserAccess(req, res, [Role.ADMIN, Role.MANAGER]))) return

    const employeeId = parseInt(req.params.id, 10)
    if (isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee ID' })
      return
    }

    const filePath = req.file?.filename
    if (!filePath) {
      res.status(400).json({ message: 'Profile picture upload failed' })
      return
    }

    const result = await this.employeeService.updateProfilePicture(employeeId, filePath)
    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({
      message: 'Profile picture updated successfully',
      employee: result.value,
      profilePictureUrl: `http://localhost:4000/uploads/${filePath}`,
    })
  }
}
