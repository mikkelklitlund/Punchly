import { Request, Response } from 'express'
import { IEmployeeService } from '../interfaces/services/IEmployeeService.js'
import { Failure, Result } from '../utils/Result.js'
import { CreateAbsenceRecordDTO, CreateEmployeeDTO, EmployeeDTO } from 'shared'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import { IAbsenceService } from '../interfaces/services/IAbsenceService.js'
import { UTCDateMini } from '@date-fns/utc'
import { endOfDay, startOfDay } from 'date-fns'
import {
  fromCreateEmployeeDTO,
  fromPartialEmployeeDTO,
  toAbsenceRecordDTO,
  toAttendanceRecordDTO,
  toEmployeeDTO,
} from '../utils/mappers.js'
import { Employee } from '../types/index.js'

export class EmployeeController {
  constructor(
    private readonly employeeService: IEmployeeService,
    private readonly attendanceService: IAttendanceService,
    private readonly absenceService: IAbsenceService
  ) {}

  public createEmployee = async (req: Request, res: Response) => {
    const newEmployee: CreateEmployeeDTO = req.body
    const result = await this.employeeService.createEmployee(fromCreateEmployeeDTO(newEmployee))

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(201).json({ employee: toEmployeeDTO(result.value) })
  }

  public getEmployeesByQueryParams = async (req: Request, res: Response) => {
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

  public getEmployeeById = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.getEmployeeById(employeeId)

    if (result instanceof Failure) {
      res.status(404).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employee: toEmployeeDTO(result.value) })
  }

  public updateEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id)
    const employee: Partial<EmployeeDTO> = req.body
    const result = await this.employeeService.updateEmployee(employeeId, fromPartialEmployeeDTO(employee))

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ employee: toEmployeeDTO(result.value) })
  }

  public deleteEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id)
    const result = await this.employeeService.deleteEmployee(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send()
  }

  public employeeCheckin = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId)
    const checkInResult = await this.attendanceService.checkInEmployee(employeeId)

    if (checkInResult instanceof Failure) {
      res.status(500).json({ message: checkInResult.error.message })
      return
    }

    res.status(200).json({ success: true })
  }

  public employeeCheckout = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId)
    const checkOutResult = await this.attendanceService.checkOutEmployee(employeeId)

    if (checkOutResult instanceof Failure) {
      res.status(500).json({ message: checkOutResult.error.message })
      return
    }

    res.status(200).json({ success: true })
  }

  public getAttendanceRecordsForEmployee = async (req: Request, res: Response) => {
    const id = parseInt(req.params.employeeId, 10)
    const { startDate, endDate } = req.query as { startDate: string; endDate: string }

    const result = await this.attendanceService.getAttendanceRecordsByEmployeeIdAndPeriod(
      id,
      new UTCDateMini(startDate),
      new UTCDateMini(endDate)
    )

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ records: result.value.map(toAttendanceRecordDTO) })
  }

  public getLast30AttendanceRecordsForEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId)

    const result = await this.attendanceService.getLast30AttendanceRecords(employeeId)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ records: result.value.map(toAttendanceRecordDTO) })
  }

  public createAttendanceRecord = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const { checkIn, checkOut } = req.body

    const result = await this.attendanceService.createAttendanceRecord({
      employeeId: id,
      checkIn: new UTCDateMini(checkIn),
      checkOut: new UTCDateMini(checkOut),
    })

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(200).json({ record: toAttendanceRecordDTO(result.value) })
  }

  public updateAttendanceRecord = async (req: Request, res: Response) => {
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

  public deleteAttendanceRecord = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)

    const result = await this.attendanceService.deleteAttendanceRecord(id)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send()
  }

  public generateAttendanceReport = async (req: Request, res: Response) => {
    const { startDate, endDate, timezone, departmentId } = req.query
    const companyId = req.companyId

    if (!companyId) {
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }

    if (!timezone || typeof timezone !== 'string') {
      res.status(400).json({ message: 'timezone must be provided' })
      return
    }

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'startDate and endDate are required query parameters' })
      return
    }

    const start = startOfDay(new UTCDateMini(startDate as string))
    const end = endOfDay(new UTCDateMini(endDate as string))
    const deptId = departmentId ? parseInt(departmentId as string, 10) : undefined

    const result = await this.attendanceService.generateEmployeeAttendanceReport(
      start,
      end,
      companyId,
      timezone,
      deptId
    )

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=employee-attendance-report.xlsx')
    res.send(result.value)
  }

  public createAbsenceForEmployee = async (req: Request, res: Response) => {
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

  public updateAbsence = async (req: Request, res: Response) => {
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

  public deleteAbsence = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    const result = await this.absenceService.deleteAbsenceRecord(id)

    if (result instanceof Failure) {
      res.status(500).json({ message: result.error.message })
      return
    }

    res.status(204).send()
  }

  public getAbsencesForEmployee = async (req: Request, res: Response) => {
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

  public uploadProfilePicture = async (req: Request, res: Response) => {
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
