import { Result, success, failure } from '../utils/Result.js'
import { ValidationError, DatabaseError, EntityNotFoundError } from '../utils/Errors.js'
import { CreateAttendanceRecord, AttendanceRecord, EmployeeWithRecords } from 'shared'
import { IAttendanceRecordRepository } from '../interfaces/repositories/IAttendanceRecordRepository.js'
import { IEmployeeRepository } from '../interfaces/repositories/IEmployeeRepositry.js'
import { IAttendanceService } from '../interfaces/services/IAttendanceService.js'
import ExcelJS from 'exceljs'
import { differenceInMinutes } from 'date-fns'
import { IAbsenceRecordRepository } from '../interfaces/repositories/IAbsenceRecordRepository.js'
import { toUTC, startOfDayUTC, endOfDayUTC } from '../utils/date.js'
import { DateInput } from '../types/index.js'

export class AttendanceService implements IAttendanceService {
  constructor(
    private readonly attendanceRecordRepository: IAttendanceRecordRepository,
    private readonly employeeRepository: IEmployeeRepository,
    private readonly absenceRecordRepository: IAbsenceRecordRepository
  ) {}

  // ---------------------- UTC helpers --------------------------

  private validateRange(start: DateInput, end: DateInput): { s: Date; e: Date } {
    if (start == null || end == null) throw new ValidationError('startDate and endDate are required')
    const s = toUTC(start)
    const e = toUTC(end)
    if (e < s) throw new ValidationError('endDate cannot be before startDate')
    return { s, e }
  }

  private async hasAbsenceOnDate(employeeId: number, date: DateInput): Promise<boolean> {
    const d = toUTC(date)
    const s = startOfDayUTC(d)
    const e = endOfDayUTC(d)
    const overlaps = await this.absenceRecordRepository.getAbsenceRecordsByEmployeeIdAndRange(employeeId, s, e)
    return overlaps.length > 0
  }

  // Use UTC formatting (backend stays UTC; frontend can localize if needed)
  private formatTimeUTC(date: Date) {
    const h = date.getUTCHours().toString().padStart(2, '0')
    const m = date.getUTCMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }

  private calculateTotalMinutes(records: { checkIn: Date; checkOut?: Date }[]): number {
    return records.reduce((sum, rec) => (rec.checkOut ? sum + differenceInMinutes(rec.checkOut, rec.checkIn) : sum), 0)
  }

  private formatMinutesToHHmm(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours},${minutes.toString().padStart(2, '0')}`
  }

  private groupByEmployeeType(data: EmployeeWithRecords[]): Record<string, EmployeeWithRecords[]> {
    return data.reduce(
      (acc, emp) => {
        const type = emp.employeeType.name
        if (!acc[type]) acc[type] = []
        acc[type].push(emp)
        return acc
      },
      {} as Record<string, EmployeeWithRecords[]>
    )
  }

  // ---------------- MAIN CRUD ---------------- //

  async createAttendanceRecord(newAttendance: CreateAttendanceRecord): Promise<Result<AttendanceRecord, Error>> {
    try {
      const checkInUTC = toUTC(newAttendance.checkIn)

      if (await this.hasAbsenceOnDate(newAttendance.employeeId, checkInUTC)) {
        return failure(new ValidationError('Employee has an active absence on this date.'))
      }

      const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord({
        ...newAttendance,
        checkIn: checkInUTC,
      })
      await this.employeeRepository.updateEmployee(newAttendance.employeeId, { checkedIn: true })
      return success(attendanceRecord)
    } catch (error) {
      console.error('Error creating attendance record:', error)
      return failure(new DatabaseError('Database error occurred while creating the attendance record.'))
    }
  }

  async checkInEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const now = toUTC(new Date())

      if (await this.hasAbsenceOnDate(employeeId, now)) {
        return failure(new ValidationError('Employee has an active absence today and cannot check in.'))
      }

      const openRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId)
      if (openRecord) {
        await this.attendanceRecordRepository.updateAttendanceRecord(openRecord.id, {
          checkOut: undefined,
          autoClosed: true,
        })
      }

      const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord({
        employeeId,
        checkIn: now,
      })

      await this.employeeRepository.updateEmployee(employeeId, { checkedIn: true })
      return success(attendanceRecord)
    } catch (error) {
      console.error('Error during employee check-in:', error)
      return failure(new DatabaseError('Database error occurred during check-in.'))
    }
  }

  async checkOutEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const now = toUTC(new Date())

      if (await this.hasAbsenceOnDate(employeeId, now)) {
        return failure(new ValidationError('Employee has an active absence today and cannot check out.'))
      }

      const attendanceRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId)
      if (!attendanceRecord) {
        return failure(new EntityNotFoundError('No ongoing attendance record found for this employee.'))
      }

      const updatedRecord = await this.attendanceRecordRepository.updateAttendanceRecord(attendanceRecord.id, {
        checkOut: now,
      })

      await this.employeeRepository.updateEmployee(employeeId, { checkedIn: false })
      return success(updatedRecord)
    } catch (error) {
      console.error('Error during employee check-out:', error)
      return failure(new DatabaseError('Database error occurred during check-out.'))
    }
  }

  async getAttendanceRecordById(id: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const attendanceRecord = await this.attendanceRecordRepository.getAttendanceRecordById(id)
      if (!attendanceRecord) {
        return failure(new EntityNotFoundError(`Attendance record with ID ${id} not found.`))
      }
      return success(attendanceRecord)
    } catch (error) {
      console.error('Error fetching attendance record by ID:', error)
      return failure(new DatabaseError('Database error occurred while fetching the attendance record.'))
    }
  }

  async getAttendanceRecordsByEmployeeIdAndPeriod(
    employeeId: number,
    periodStart: DateInput,
    periodEnd: DateInput
  ): Promise<Result<AttendanceRecord[], Error>> {
    try {
      // Normalize + validate, then pass UTC instants to repo
      const { s, e } = this.validateRange(periodStart, periodEnd)
      const attendanceRecords = await this.attendanceRecordRepository.getAttendanceRecordsByEmployeeIdAndPeriod(
        employeeId,
        s,
        e
      )
      return success(attendanceRecords)
    } catch (error) {
      if (error instanceof ValidationError) return failure(error)
      console.error('Error fetching attendance records for employee by period:', error)
      return failure(new DatabaseError('Database error occurred while fetching attendance records.'))
    }
  }

  async updateAttendanceRecord(
    id: number,
    data: Partial<Omit<AttendanceRecord, 'id'>>
  ): Promise<Result<AttendanceRecord, Error>> {
    if (!data) return failure(new ValidationError('Update data is required.'))

    try {
      const patch: Partial<AttendanceRecord> = { ...data }
      if (patch.checkIn) patch.checkIn = toUTC(patch.checkIn)
      if (patch.checkOut) patch.checkOut = toUTC(patch.checkOut)

      const updatedAttendanceRecord = await this.attendanceRecordRepository.updateAttendanceRecord(id, patch)
      return success(updatedAttendanceRecord)
    } catch (error) {
      console.error('Error updating attendance record:', error)
      return failure(new DatabaseError('Database error occurred while updating the attendance record.'))
    }
  }

  async deleteAttendanceRecord(id: number): Promise<Result<AttendanceRecord, Error>> {
    try {
      const deletedAttendanceRecord = await this.attendanceRecordRepository.deleteAttendanceRecord(id)
      return success(deletedAttendanceRecord)
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      return failure(new DatabaseError('Database error occurred while deleting the attendance record.'))
    }
  }

  async getLast30AttendanceRecords(employeeId: number): Promise<Result<AttendanceRecord[], Error>> {
    try {
      const records = await this.attendanceRecordRepository.getLast30ByEmployeeId(employeeId)
      return success(records)
    } catch (error) {
      console.error('Error fetching last 30 attendance records:', error)
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

    sheet.getColumn(1).width = 20
    sheet.getColumn(2).width = 25
    sheet.getColumn(3).width = 20
    sheet.getColumn(4).width = 30
    sheet.getColumn(5).width = 20
    sheet.getColumn(6).width = 20
    sheet.getColumn(7).width = 20

    const grouped = this.groupByEmployeeType(data)

    for (const [type, employees] of Object.entries(grouped)) {
      this.addSectionHeader(sheet, type, 7)
      this.addTableHeader(sheet, [
        'Afdeling',
        'Navn',
        'Fødselsdato',
        'Adresse',
        'Timeløn (kr.)',
        'Månedsløn (kr.)',
        'Månedlige timer',
      ])

      for (const em of employees) {
        const row = sheet.addRow([
          em.department.name,
          em.name,
          // birthdate is @db.Date in your schema, render as YYYY-MM-DD
          em.birthdate.toISOString().split('T')[0],
          em.address,
          em.hourlySalary ?? '',
          em.monthlySalary ?? '',
          em.monthlyHours ?? '',
        ])
        this.centerAlignRow(row)
      }

      sheet.addRow([])
    }

    return workbook
  }

  private generateRecordSheet(workbook: ExcelJS.Workbook, data: EmployeeWithRecords[]): ExcelJS.Workbook {
    const sheet = workbook.addWorksheet('Registrerede tider')
    const employeesList = data.map((e) => e.name)

    // Build a set of all UTC dates (YYYY-MM-DD) present across attendance and absence
    const dates = Array.from(
      new Set(
        data.flatMap((e) => [
          ...e.attendanceRecords.map((r) => r.checkIn.toISOString().split('T')[0]),
          ...e.absenceRecords.flatMap((a) => {
            const days: string[] = []
            // iterate day-by-day in UTC from start to end (inclusive)
            const cur = startOfDayUTC(a.startDate)
            const end = endOfDayUTC(a.endDate)
            while (cur <= end) {
              days.push(cur.toISOString().split('T')[0])
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
          (a) => date >= a.startDate.toISOString().split('T')[0] && date <= a.endDate.toISOString().split('T')[0]
        )
        if (absence) {
          checkInRow.push(absence.absenceType.name)
          checkOutRow.push(absence.absenceType.name)
        } else {
          const record = emp.attendanceRecords.find((r) => r.checkIn.toISOString().split('T')[0] === date)
          checkInRow.push(record ? this.formatTimeUTC(record.checkIn) : '')
          checkOutRow.push(record?.checkOut ? this.formatTimeUTC(record.checkOut) : '')
        }
      }

      const checkInRowObj = sheet.addRow(checkInRow)
      checkInRowObj.getCell(1).font = { bold: true }
      this.centerAlignRow(checkInRowObj)

      const checkOutRowObj = sheet.addRow(checkOutRow)
      checkOutRowObj.getCell(1).font = { bold: true }
      this.centerAlignRow(checkOutRowObj)

      data.forEach((emp, idx) => {
        const record = emp.attendanceRecords.find((r) => r.checkIn.toISOString().split('T')[0] === date)
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
        const dayRecords = emp.attendanceRecords.filter((r) => r.checkIn.toISOString().split('T')[0] === date)
        const totalMinutes = this.calculateTotalMinutes(dayRecords)
        const cell = totalRowObj.getCell(index + 2)
        cell.value = totalMinutes / 60
        cell.numFmt = '0.00'
        cell.alignment = { horizontal: 'center' }
        cell.border = { top: { style: 'thin' } }
      })

      this.centerAlignRow(totalRowObj)
      sheet.addRow([])
    }

    return workbook
  }

  private generateSalarySheet(workbook: ExcelJS.Workbook, data: EmployeeWithRecords[]): ExcelJS.Workbook {
    const sheet = workbook.addWorksheet('Samlet løn')
    const grouped = this.groupByEmployeeType(data)

    for (const [type, employees] of Object.entries(grouped)) {
      this.addSectionHeader(sheet, type, 6)
      this.addTableHeader(sheet, [
        'Navn',
        'Timeløn (kr.)',
        'Månedsløn (kr.)',
        'Månedlige timer',
        'Registrerede timer (hh,mm)',
        'Total løn (kr.)',
      ])

      for (const emp of employees) {
        const totalMinutes = this.calculateTotalMinutes(emp.attendanceRecords)
        const totalHours = totalMinutes / 60
        const totalEarnings = emp.hourlySalary ? totalHours * emp.hourlySalary : (emp.monthlySalary ?? 0)

        const row = sheet.addRow([
          emp.name,
          emp.hourlySalary ?? '',
          emp.monthlySalary ?? '',
          emp.monthlyHours ?? '',
          this.formatMinutesToHHmm(totalMinutes),
          emp.hourlySalary ? totalEarnings.toFixed(2) : (emp.monthlySalary?.toFixed(2) ?? ''),
        ])
        this.centerAlignRow(row)
      }
      sheet.addRow([])
    }

    this.autoFitColumns(sheet)
    return workbook
  }

  // ---------------- MAIN ENTRY ---------------- //

  async generateEmployeeAttendanceReport(
    startDate: DateInput,
    endDate: DateInput,
    companyId: number,
    departmentId?: number
  ): Promise<Result<Buffer, Error>> {
    try {
      const { s, e } = this.validateRange(startDate, endDate)
      const sDay = startOfDayUTC(s)
      const eDay = endOfDayUTC(e)

      const data = await this.employeeRepository.getEmployeesWithAttendanceAndAbsences(
        sDay,
        eDay,
        companyId,
        departmentId
      )

      let workbook = new ExcelJS.Workbook()
      workbook = this.generateEmployeeOverviewSheet(workbook, data)
      workbook = this.generateRecordSheet(workbook, data)
      workbook = this.generateSalarySheet(workbook, data)

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
      console.error(err)
      return failure(new DatabaseError('Failed to generate employee attendance report'))
    }
  }
}
