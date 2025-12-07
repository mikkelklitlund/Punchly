import { Result, success, failure } from '../utils/Result.js'
import { ValidationError, DatabaseError, EntityNotFoundError } from '../utils/Errors.js'
import { IAttendanceRecordRepository } from '../interfaces/repositories/IAttendanceRecordRepository.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import ExcelJS from 'exceljs'
import { differenceInMinutes, endOfDay, startOfDay, isBefore } from 'date-fns'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { AttendanceRecord, CreateAttendanceRecord, EmployeeWithRecords } from '../types/index.js'
import { format, toZonedTime } from 'date-fns-tz'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'
import { Logger } from 'pino'

export class AttendanceService implements IAttendanceService {
  constructor(
    private readonly attendanceRecordRepository: IAttendanceRecordRepository,
    private readonly employeeRepository: IEmployeeRepository,
    private readonly absenceRecordRepository: IAbsenceRecordRepository,
    private readonly logger: Logger
  ) {}

  private async hasAbsenceOnDate(employeeId: number, date: Date): Promise<boolean> {
    const start = startOfDay(date)
    const end = endOfDay(date)
    const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(employeeId, start, end)
    return overlaps.length > 0
  }

  private calculateTotalMinutes(records: { checkIn: Date; checkOut?: Date }[]): number {
    return records.reduce((sum, rec) => (rec.checkOut ? sum + differenceInMinutes(rec.checkOut, rec.checkIn) : sum), 0)
  }

  private formatMinutesToHHmm(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  private formatTimeForTz(date: Date, tz: string) {
    const zoned = toZonedTime(date, tz)
    return format(zoned, 'HH:mm', { timeZone: tz })
  }

  private formatDateForTz(date: Date, tz: string): string {
    const zoned = toZonedTime(date, tz)
    return format(zoned, 'yyyy-MM-dd', { timeZone: tz })
  }

  private groupByEmployeeType(data: EmployeeWithRecords[]): Record<string, EmployeeWithRecords[]> {
    return data.reduce(
      (acc, emp) => {
        const type = emp.employeeType?.name ?? 'Unknown'
        if (!acc[type]) acc[type] = []
        acc[type].push(emp)
        return acc
      },
      {} as Record<string, EmployeeWithRecords[]>
    )
  }

  async createAttendanceRecord(newAttendance: CreateAttendanceRecord): Promise<Result<AttendanceRecord, Error>> {
    // Validate required params before attempting DB operations
    if (!newAttendance.checkIn || !newAttendance.checkOut) {
      this.logger.warn(
        { employeeId: newAttendance.employeeId },
        'Attempt to create full attendance record failed: missing checkIn/checkOut'
      )
      return failure(new ValidationError('When creating a full attendance record, all params must be present'))
    }

    if (isBefore(newAttendance.checkOut, newAttendance.checkIn)) {
      this.logger.warn(
        { employeeId: newAttendance.employeeId, checkIn: newAttendance.checkIn, checkOut: newAttendance.checkOut },
        'Attempt to create full attendance record failed: checkout before checkin'
      )
      return failure(new ValidationError('Checkout cannot be before checkin'))
    }

    try {
      if (await this.hasAbsenceOnDate(newAttendance.employeeId, newAttendance.checkIn)) {
        this.logger.warn(
          { employeeId: newAttendance.employeeId, checkIn: newAttendance.checkIn },
          'Attempt to create attendance record failed: active absence found on date'
        )
        return failure(new ValidationError('Employee has an active absence on this date.'))
      }

      const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord({
        ...newAttendance,
      })

      return success(attendanceRecord)
    } catch (err) {
      this.logger.error({ error: err, data: newAttendance }, 'Database error during creation of attendance record')
      return failure(new DatabaseError('Database error occurred while creating the attendance record.'))
    }
  }

  async checkInEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const now = new Date()

      if (await this.hasAbsenceOnDate(employeeId, now)) {
        this.logger.warn({ employeeId, date: now }, 'Check-in failed: employee has active absence today')
        return failure(new ValidationError('Employee has an active absence today and cannot check in.'))
      }

      const openRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId)
      if (openRecord) {
        this.logger.warn(
          { employeeId, openRecordId: openRecord.id },
          'Auto-closing previous open record during check-in'
        )
        await this.attendanceRecordRepository.updateAttendanceRecord(openRecord.id, {
          checkOut: now,
          autoClosed: true,
        })
      }

      const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord({
        employeeId,
        checkIn: now,
      })

      await this.employeeRepository.updateEmployee(employeeId, { checkedIn: true })

      return success(attendanceRecord)
    } catch (err) {
      this.logger.error({ error: err, employeeId }, 'Database error during employee check-in')
      return failure(new DatabaseError('Database error occurred during check-in.'))
    }
  }

  async checkOutEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const now = new Date()

      if (await this.hasAbsenceOnDate(employeeId, now)) {
        this.logger.warn({ employeeId, date: now }, 'Check-out failed: employee has active absence today')
        return failure(new ValidationError('Employee has an active absence today and cannot check out.'))
      }

      const attendanceRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId)
      if (!attendanceRecord) {
        this.logger.warn({ employeeId }, 'Check-out failed: no ongoing record found')
        return failure(new EntityNotFoundError('No ongoing attendance record found for this employee.'))
      }

      const updatedRecord = await this.attendanceRecordRepository.updateAttendanceRecord(attendanceRecord.id, {
        checkOut: now,
      })

      await this.employeeRepository.updateEmployee(employeeId, { checkedIn: false })
      return success(updatedRecord)
    } catch (err) {
      this.logger.error({ error: err, employeeId }, 'Database error during employee check-out')
      return failure(new DatabaseError('Database error occurred during check-out.'))
    }
  }

  async getAttendanceRecordById(id: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const attendanceRecord = await this.attendanceRecordRepository.getAttendanceRecordById(id)
      if (!attendanceRecord) {
        this.logger.debug({ id }, 'Attendance record not found by ID')
        return failure(new EntityNotFoundError(`Attendance record with ID ${id} not found.`))
      }
      return success(attendanceRecord)
    } catch (err) {
      this.logger.error({ error: err, id }, 'Error fetching attendance record by ID')
      return failure(new DatabaseError('Database error occurred while fetching the attendance record.'))
    }
  }

  async getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Result<AttendanceRecord[], Error>> {
    try {
      const attendanceRecords = await this.attendanceRecordRepository.getAttendanceRecordsByEmployeeIdAndPeriod(
        employeeId,
        periodStart,
        periodEnd
      )
      return success(attendanceRecords)
    } catch (err) {
      if (err instanceof ValidationError) return failure(err)
      this.logger.error(
        { error: err, employeeId, periodStart, periodEnd },
        'Error fetching attendance records for employee by period'
      )
      return failure(new DatabaseError('Database error occurred while fetching attendance records.'))
    }
  }

  async updateAttendanceRecord(
    id: number,
    data: Partial<Omit<AttendanceRecord, 'id'>>
  ): Promise<Result<AttendanceRecord, Error>> {
    if (!data) {
      this.logger.warn({ id }, 'Update attendance record failed: missing update data')
      return failure(new ValidationError('Update data is required.'))
    }

    try {
      const attendanceRecord = await this.attendanceRecordRepository.getAttendanceRecordById(id)

      if (!attendanceRecord) {
        this.logger.warn({ id }, 'Update attendance record failed: record not found')
        return failure(new ValidationError('Found no record with id'))
      }

      if (data.employeeId && data.employeeId !== attendanceRecord.employeeId) {
        this.logger.warn(
          { id, existingEmployeeId: attendanceRecord.employeeId, newEmployeeId: data.employeeId },
          'Update attendance record failed: attempt to change employeeId'
        )
        return failure(new ValidationError('Cannot change employee on existing attendance record'))
      }

      const newCheckIn = data.checkIn ?? attendanceRecord.checkIn
      const newCheckOut = data.checkOut ?? attendanceRecord.checkOut

      if (await this.hasAbsenceOnDate(attendanceRecord.employeeId, newCheckIn)) {
        this.logger.warn(
          { id, checkIn: newCheckIn },
          'Update attendance record failed: active absence found on checkIn date'
        )
        return failure(new ValidationError('Employee has an active absence on this date.'))
      }

      if (newCheckOut) {
        if (newCheckIn >= newCheckOut) {
          this.logger.warn(
            { id, checkIn: newCheckIn, checkOut: newCheckOut },
            'Update attendance record failed: Check in after checkout'
          )
          return failure(new ValidationError('Check in cannot be after checkout'))
        }

        if (await this.hasAbsenceOnDate(attendanceRecord.employeeId, newCheckOut)) {
          this.logger.warn(
            { id, checkOut: newCheckOut },
            'Update attendance record failed: active absence found on checkOut date'
          )
          return failure(new ValidationError('Employee has an active absence on this date.'))
        }
      }

      const updatedAttendanceRecord = await this.attendanceRecordRepository.updateAttendanceRecord(id, {
        ...(data.checkIn ? { checkIn: data.checkIn } : {}),
        ...(data.checkOut ? { checkOut: data.checkOut, autoClosed: false } : {}),
      })
      return success(updatedAttendanceRecord)
    } catch (err) {
      this.logger.error({ error: err, id, data }, 'Database error during update of attendance record')
      return failure(new DatabaseError('Database error occurred while updating the attendance record.'))
    }
  }

  async deleteAttendanceRecord(id: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const deletedAttendanceRecord = await this.attendanceRecordRepository.deleteAttendanceRecord(id)
      return success(deletedAttendanceRecord)
    } catch (err) {
      this.logger.error({ error: err, id }, 'Error deleting attendance record')
      return failure(new DatabaseError('Database error occurred while deleting the attendance record.'))
    }
  }

  async getLast30AttendanceRecords(employeeId: number): Promise<Result<AttendanceRecord[], Error>> {
    try {
      const records = await this.attendanceRecordRepository.getLast30ByEmployeeId(employeeId)
      return success(records)
    } catch (err) {
      this.logger.error({ error: err, employeeId }, 'Error fetching last 30 attendance records')
      return failure(new DatabaseError('Database error occurred while fetching recent attendance records.'))
    }
  }

  // ---------------------- Report functions --------------------------

  private centerAlignRow(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
  }

  private addSectionHeader(sheet: ExcelJS.Worksheet, title: string, colSpan: number) {
    const headerRow = sheet.addRow([title])
    sheet.mergeCells(headerRow.number, 1, headerRow.number, colSpan)
    headerRow.font = { bold: true, size: 14 }
    headerRow.alignment = { horizontal: 'center' }
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    headerRow.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' } }
    return headerRow
  }

  private addTableHeader(sheet: ExcelJS.Worksheet, headers: string[]) {
    const headerRow = sheet.addRow(headers)
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center' }
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9CA3AF' } }
    })
    return headerRow
  }

  private autoFitColumns(sheet: ExcelJS.Worksheet) {
    sheet.columns?.forEach((column) => {
      if (!column) return
      let maxLength = 0
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) maxLength = columnLength
      })
      column.width = maxLength < 10 ? 10 : maxLength + 2
    })
  }

  // ---------------- SHEET GENERATORS ---------------- //

  private generateEmployeeOverviewSheet(workbook: ExcelJS.Workbook, data: EmployeeWithRecords[]): ExcelJS.Workbook {
    const sheet = workbook.addWorksheet('Medarbejdere')

    const grouped = this.groupByEmployeeType(data)

    for (const [type, employees] of Object.entries(grouped)) {
      this.addSectionHeader(sheet, type, 7)
      this.addTableHeader(sheet, ['Afdeling', 'Navn', 'Fødselsdato'])

      for (const em of employees) {
        const birth = em.birthdate ? new Date(em.birthdate).toISOString().split('T')[0] : ''
        const row = sheet.addRow([em.department?.name ?? '', em.name ?? '', birth])
        this.centerAlignRow(row)
      }

      sheet.addRow([])
    }

    return workbook
  }

  private generateRecordSheet(workbook: ExcelJS.Workbook, data: EmployeeWithRecords[], tz: string): ExcelJS.Workbook {
    const sheet = workbook.addWorksheet('Registrerede tider')
    const employeesList = data.map((e) => e.name)

    const dates = Array.from(
      new Set(
        data.flatMap((e) => [
          ...e.attendanceRecords.map((r) => this.formatDateForTz(r.checkIn, tz)),
          ...e.absenceRecords.flatMap((a) => {
            const days: string[] = []
            const cur = new Date(a.startDate)
            const end = new Date(a.endDate)

            while (cur <= end) {
              days.push(this.formatDateForTz(cur, tz))
              cur.setUTCDate(cur.getUTCDate() + 1)
            }
            return days
          }),
        ])
      )
    ).sort()

    const headerRow = sheet.addRow(['', ...employeesList])
    headerRow.font = { bold: true }
    this.centerAlignRow(headerRow)
    sheet.columns = [{ width: 10 }, ...employeesList.map(() => ({ width: 15 }))]

    for (const date of dates) {
      const dateRow = sheet.addRow([date])
      sheet.mergeCells(`A${dateRow.number}:${String.fromCharCode(65 + employeesList.length)}${dateRow.number}`)
      dateRow.font = { bold: true }
      dateRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })

      const checkInRow = ['Tjek ind']
      const checkOutRow = ['Tjek ud']

      for (const emp of data) {
        const absence = emp.absenceRecords.find(
          (a) => date >= this.formatDateForTz(a.startDate, tz) && date <= this.formatDateForTz(a.endDate, tz)
        )

        if (absence) {
          checkInRow.push(absence.absenceType?.name ?? '')
          checkOutRow.push(absence.absenceType?.name ?? '')
        } else {
          const record = emp.attendanceRecords.find((r) => this.formatDateForTz(r.checkIn, tz) === date)
          checkInRow.push(record ? this.formatTimeForTz(record.checkIn, tz) : '')
          checkOutRow.push(record?.checkOut ? this.formatTimeForTz(record.checkOut, tz) : '')
        }
      }

      const checkInRowObj = sheet.addRow(checkInRow)
      checkInRowObj.getCell(1).font = { bold: true }
      this.centerAlignRow(checkInRowObj)

      const checkOutRowObj = sheet.addRow(checkOutRow)
      checkOutRowObj.getCell(1).font = { bold: true }
      this.centerAlignRow(checkOutRowObj)

      data.forEach((emp, idx) => {
        const record = emp.attendanceRecords.find((r) => this.formatDateForTz(r.checkIn, tz) === date)
        if (record?.autoClosed) {
          const cell = checkOutRowObj.getCell(idx + 2)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }
        }
      })

      const totalRowObj = sheet.addRow([])
      totalRowObj.getCell(1).value = 'Daglig total'
      totalRowObj.getCell(1).font = { bold: true }
      totalRowObj.getCell(1).border = { top: { style: 'thin' } }

      data.forEach((emp, index) => {
        const dayRecords = emp.attendanceRecords.filter((r) => this.formatDateForTz(r.checkIn, tz) === date)
        const totalMinutes = this.calculateTotalMinutes(dayRecords)
        const cell = totalRowObj.getCell(index + 2)
        cell.value = this.formatMinutesToHHmm(totalMinutes)
        cell.alignment = { horizontal: 'center' }
        cell.border = { top: { style: 'thin' } }
      })

      this.centerAlignRow(totalRowObj)
      sheet.addRow([])
    }

    return workbook
  }

  async generateEmployeeAttendanceReport(
    startDate: Date,
    endDate: Date,
    companyId: number,
    tz: string,
    departmentId?: number
  ): Promise<Result<Buffer, Error>> {
    try {
      const data = await this.employeeRepository.getEmployeesWithAttendanceAndAbsences(
        startDate,
        endDate,
        companyId,
        departmentId
      )

      let workbook = new ExcelJS.Workbook()
      workbook = this.generateEmployeeOverviewSheet(workbook, data)
      workbook = this.generateRecordSheet(workbook, data, tz)

      for (const sheet of workbook.worksheets) {
        await sheet.protect('YourPasswordHere', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      return success(Buffer.from(buffer))
    } catch (err) {
      if (err instanceof ValidationError) return failure(err)
      this.logger.error(
        { error: err, startDate, endDate, companyId, departmentId },
        'Failed to generate employee attendance report'
      )
      return failure(new DatabaseError('Failed to generate employee attendance report'))
    }
  }

  async getDailyOverview(companyId: number, dayStart: Date, dayEnd: Date): Promise<Result<AttendanceRecord[], Error>> {
    try {
      const records = await this.attendanceRecordRepository.getRecordsByCompanyIdAndDateRange(
        companyId,
        dayStart,
        dayEnd
      )
      return success(records)
    } catch (err) {
      this.logger.error({ error: err, companyId, dayStart, dayEnd }, 'Error fetching daily overview')
      return failure(new DatabaseError('Database error occurred while fetching daily overview.'))
    }
  }
}
