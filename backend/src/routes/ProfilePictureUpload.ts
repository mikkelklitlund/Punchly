import { Router, Request, Response } from 'express'
import { upload } from '../middleware/Upload'
import { IEmployeeService } from '../interfaces/services/IEmployeeService'
import { Failure } from '../utils/Result'

export class EmployeePictureRoutes {
  public router: Router

  constructor(private readonly employeeService: IEmployeeService) {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(
      '/upload-profile-picture/:id',
      upload.single('profilePicture'),
      this.uploadProfilePicture.bind(this)
    )
  }

  private async uploadProfilePicture(req: Request, res: Response) {
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

    try {
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
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'An error occurred while updating the profile picture' })
    }
  }
}
