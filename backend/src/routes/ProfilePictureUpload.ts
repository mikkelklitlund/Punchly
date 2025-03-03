import { Router, Response } from 'express'
import { upload } from '../middleware/Upload'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { Failure } from '../utils/Result'
import authMiddleware from '../middleware/Auth'
import authorizeRoles from '../middleware/authorizeRole'
import { AuthenticatedRequest } from '../interfaces/AuthenticateRequest'
import { IUserService } from '../interfaces/services/IUserService'
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
