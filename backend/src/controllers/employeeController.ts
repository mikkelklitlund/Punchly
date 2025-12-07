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
    req.log?.info({ companyId: newEmployee.companyId }, 'Attempting to create new employee')

    const result = await this.employeeService.createEmployee(fromCreateEmployeeDTO(newEmployee))

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message }, 'Failed to create employee')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ employeeId: result.value.id }, 'Employee created successfully')
    res.status(201).json({ employee: toEmployeeDTO(result.value) })
  }

  public getEmployeesByQueryParams = async (req: Request, res: Response) => {
    const companyId = parseInt(req.query.company as string)
    const departmentId = req.query.department ? parseInt(req.query.department as string) : null
    const employeeType = req.query.type ? parseInt(req.query.type as string) : null

    req.log?.debug({ companyId, departmentId, employeeType }, 'Fetching employees by query parameters')

    let result: Result<Employee[], Error>
    if (departmentId) {
      result = await this.employeeService.getAllEmployeesByDepartmentIdAndCompanyId(departmentId, companyId)
    } else {
      result = await this.employeeService.getAllEmployeesByCompanyId(companyId)
    }

    if (result instanceof Failure) {
      req.log?.error({ error: result.error.message, companyId, departmentId }, 'Failed to fetch employees by query')
      res.status(500).json({ message: result.error.message })
      return
    }

    if (employeeType) {
      result.value = result.value.filter((em) => em.employeeTypeId === employeeType)
    }

    req.log?.debug({ companyId, count: result.value.length }, 'Employees fetched successfully')
    res.status(200).json({ employees: result.value.map(toEmployeeDTO) })
  }

  public getEmployeeById = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id)
    req.log?.debug({ employeeId }, 'Fetching employee by ID')

    const result = await this.employeeService.getEmployeeById(employeeId)

    if (result instanceof Failure) {
      req.log?.warn({ employeeId, error: result.error.message }, 'Employee not found (404)')
      res.status(404).json({ message: result.error.message })
      return
    }

    req.log?.debug({ employeeId }, 'Employee fetched successfully')
    res.status(200).json({ employee: toEmployeeDTO(result.value) })
  }

  public updateEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id)
    const employee: Partial<EmployeeDTO> = req.body
    req.log?.info({ employeeId }, 'Attempting to update employee details')

    const result = await this.employeeService.updateEmployee(employeeId, fromPartialEmployeeDTO(employee))

    if (result instanceof Failure) {
      req.log?.error({ employeeId, error: result.error.message }, 'Failed to update employee')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ employeeId }, 'Employee updated successfully')
    res.status(200).json({ employee: toEmployeeDTO(result.value) })
  }

  public deleteEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id)
    req.log?.warn({ employeeId }, 'Attempting to delete employee')

    const result = await this.employeeService.deleteEmployee(employeeId)

    if (result instanceof Failure) {
      req.log?.error({ employeeId, error: result.error.message }, 'Failed to delete employee')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ employeeId }, 'Employee deleted successfully')
    res.status(204).send()
  }

  public employeeCheckin = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId)
    req.log?.info({ employeeId }, 'Attempting employee check-in')

    const checkInResult = await this.attendanceService.checkInEmployee(employeeId)

    if (checkInResult instanceof Failure) {
      req.log?.error({ employeeId, error: checkInResult.error.message }, 'Employee check-in failed')
      res.status(500).json({ message: checkInResult.error.message })
      return
    }

    req.log?.info({ employeeId }, 'Employee checked in successfully')
    res.status(200).json({ success: true })
  }

  public employeeCheckout = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId)
    req.log?.info({ employeeId }, 'Attempting employee check-out')

    const checkOutResult = await this.attendanceService.checkOutEmployee(employeeId)

    if (checkOutResult instanceof Failure) {
      req.log?.error({ employeeId, error: checkOutResult.error.message }, 'Employee check-out failed')
      res.status(500).json({ message: checkOutResult.error.message })
      return
    }

    req.log?.info({ employeeId }, 'Employee checked out successfully')
    res.status(200).json({ success: true })
  }

  public getAttendanceRecordsForEmployee = async (req: Request, res: Response) => {
    const id = parseInt(req.params.employeeId, 10)
    const { startDate, endDate } = req.query as { startDate: string; endDate: string }

    req.log?.debug({ employeeId: id, startDate, endDate }, 'Fetching attendance records by period')

    const result = await this.attendanceService.getAttendanceRecordsByEmployeeIdAndPeriod(
      id,
      new UTCDateMini(startDate),
      new UTCDateMini(endDate)
    )

    if (result instanceof Failure) {
      req.log?.error({ employeeId: id, error: result.error.message }, 'Failed to fetch attendance records by period')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ employeeId: id, count: result.value.length }, 'Attendance records fetched successfully')
    res.status(200).json({ records: result.value.map(toAttendanceRecordDTO) })
  }

  public getLast30AttendanceRecordsForEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId)
    req.log?.debug({ employeeId }, 'Fetching last 30 attendance records')

    const result = await this.attendanceService.getLast30AttendanceRecords(employeeId)

    if (result instanceof Failure) {
      req.log?.error({ employeeId, error: result.error.message }, 'Failed to fetch last 30 attendance records')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.debug({ employeeId, count: result.value.length }, 'Last 30 attendance records fetched successfully')
    res.status(200).json({ records: result.value.map(toAttendanceRecordDTO) })
  }

  public createAttendanceRecord = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const { checkIn, checkOut } = req.body
    req.log?.info({ employeeId: id, checkIn, checkOut }, 'Attempting to create attendance record manually')

    const result = await this.attendanceService.createAttendanceRecord({
      employeeId: id,
      checkIn: new UTCDateMini(checkIn),
      checkOut: new UTCDateMini(checkOut),
    })

    if (result instanceof Failure) {
      req.log?.error({ employeeId: id, error: result.error.message }, 'Failed to create attendance record manually')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ recordId: result.value.id }, 'Attendance record created successfully')
    res.status(200).json({ record: toAttendanceRecordDTO(result.value) })
  }

  public updateAttendanceRecord = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const { checkIn, checkOut } = req.body
    req.log?.info({ recordId: id, checkIn, checkOut }, 'Attempting to update attendance record')

    const result = await this.attendanceService.updateAttendanceRecord(id, {
      checkIn: checkIn ? new UTCDateMini(checkIn) : undefined,
      checkOut: checkOut ? new UTCDateMini(checkOut) : undefined,
    })

    if (result instanceof Failure) {
      req.log?.error({ recordId: id, error: result.error.message }, 'Failed to update attendance record')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ recordId: id }, 'Attendance record updated successfully')
    res.status(200).json({ record: toAttendanceRecordDTO(result.value) })
  }

  public deleteAttendanceRecord = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    req.log?.warn({ recordId: id }, 'Attempting to delete attendance record')

    const result = await this.attendanceService.deleteAttendanceRecord(id)

    if (result instanceof Failure) {
      req.log?.error({ recordId: id, error: result.error.message }, 'Failed to delete attendance record')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ recordId: id }, 'Attendance record deleted successfully')
    res.status(204).send()
  }

  public generateAttendanceReport = async (req: Request, res: Response) => {
    const { startDate, endDate, timezone, departmentId } = req.query
    const companyId = req.companyId

    req.log?.info({ companyId, startDate, endDate, departmentId }, 'Attempting to generate attendance report')

    if (!companyId) {
      req.log?.error('CompanyId missing when generating attendance report')
      res.status(500).json({ message: 'CompanyId must be provided, try to log out and login again' })
      return
    }

    if (!timezone || typeof timezone !== 'string') {
      req.log?.warn({ companyId, timezone }, 'Missing or invalid timezone for report (400)')
      res.status(400).json({ message: 'timezone must be provided' })
      return
    }

    if (!startDate || !endDate) {
      req.log?.warn({ companyId, startDate, endDate }, 'Missing date range for report (400)')
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
      req.log?.error({ companyId, error: result.error.message }, 'Attendance report generation failed')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ companyId, size: result.value.byteLength }, 'Attendance report generated successfully')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=employee-attendance-report.xlsx')
    res.send(result.value)
  }

  public createAbsenceForEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId, 10)
    const { startDate, endDate, absenceTypeId } = req.body as CreateAbsenceRecordDTO

    req.log?.info({ employeeId, startDate, endDate, absenceTypeId }, 'Attempting to create absence record')

    const start = new UTCDateMini(startDate)
    const end = new UTCDateMini(endDate)

    const result = await this.absenceService.createAbsenceRecord({
      employeeId,
      startDate: start,
      endDate: end,
      absenceTypeId,
    })

    if (result instanceof Failure) {
      req.log?.error({ employeeId, error: result.error.message }, 'Failed to create absence record')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ absenceId: result.value.id, employeeId }, 'Absence record created successfully')
    res.status(201).json({ absenceRecord: toAbsenceRecordDTO(result.value) })
  }

  public updateAbsence = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const { startDate, endDate, absenceTypeId } = req.body as {
      startDate?: string
      endDate?: string
      absenceTypeId?: number
    }

    req.log?.info({ absenceId: id, startDate, endDate, absenceTypeId }, 'Attempting to update absence record')

    const result = await this.absenceService.updateAbsenceRecord(id, {
      ...(startDate ? { startDate: new UTCDateMini(startDate) } : {}),
      ...(endDate ? { endDate: new UTCDateMini(endDate) } : {}),
      ...(typeof absenceTypeId === 'number' ? { absenceTypeId } : {}),
    })

    if (result instanceof Failure) {
      req.log?.error({ absenceId: id, error: result.error.message }, 'Failed to update absence record')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.info({ absenceId: id }, 'Absence record updated successfully')
    res.status(200).json({ absenceRecord: toAbsenceRecordDTO(result.value) })
  }

  public deleteAbsence = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)

    req.log?.warn({ absenceId: id }, 'Attempting to delete absence record')

    const result = await this.absenceService.deleteAbsenceRecord(id)

    if (result instanceof Failure) {
      req.log?.error({ absenceId: id, error: result.error.message }, 'Failed to delete absence record')
      res.status(500).json({ message: result.error.message })
      return
    }

    req.log?.info({ absenceId: id }, 'Absence record deleted successfully')
    res.status(204).send()
  }

  public getAbsencesForEmployee = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.employeeId, 10)
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string }
    req.log?.debug({ employeeId, startDate, endDate }, 'Fetching absence records for employee')

    let result
    if (startDate && endDate) {
      const start = new UTCDateMini(startDate)
      const end = new UTCDateMini(endDate)
      result = await this.absenceService.getAbsenceRecordsByEmployeeIdAndRange(employeeId, start, end)
    } else {
      result = await this.absenceService.getAbsenceRecordsByEmployeeId(employeeId)
    }

    if (result instanceof Failure) {
      req.log?.error({ employeeId, error: result.error.message }, 'Failed to fetch absence records for employee')
      return res.status(500).json({ message: result.error.message })
    }

    req.log?.debug({ employeeId, count: result.value.length }, 'Absence records fetched successfully')
    res.status(200).json({ absences: result.value.map(toAbsenceRecordDTO) })
  }

  public uploadProfilePicture = async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id, 10)

    req.log?.info({ employeeId }, 'Attempting to upload profile picture')

    if (isNaN(employeeId)) {
      req.log?.warn({ idParam: req.params.id }, 'Invalid employee ID during upload (400)')
      res.status(400).json({ message: 'Invalid employee ID' })
      return
    }

    const filePath = req.file?.filename
    if (!filePath) {
      req.log?.warn({ employeeId }, 'Profile picture upload failed (no file uploaded, 400)')
      res.status(400).json({ message: 'Profile picture upload failed' })
      return
    }

    const result = await this.employeeService.updateProfilePicture(employeeId, filePath)
    if (result instanceof Failure) {
      req.log?.error({ employeeId, error: result.error.message }, 'Failed to update profile picture path in DB')
      res.status(500).json({ message: result.error.message })
      return
    }

    const profilePictureUrl = `${req.protocol}://${req.get('host')}/uploads/${filePath}`
    req.log?.info({ employeeId, profilePictureUrl }, 'Profile picture updated successfully')

    res.status(200).json({
      message: 'Profile picture updated successfully',
      employee: result.value,
      profilePictureUrl,
    })
  }
}
