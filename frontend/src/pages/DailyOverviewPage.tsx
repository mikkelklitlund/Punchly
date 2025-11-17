import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Column } from '../components/common/DataTable'
import DataTable from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import { useEmployees } from '../hooks/useEmployees'
import { useDailyOverview } from '../hooks/useDailyOverview'
import { AttendanceRecordDTO, EmployeeDTO } from 'shared'

const DailyOverviewPage = () => {
  const { companyId } = useAuth()
  const { departments } = useCompany()
  const { data: employees = [], isLoading: empLoading, error: empError } = useEmployees(companyId, { live: false })

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const { data: records = [], isLoading, error } = useDailyOverview(companyId, selectedDate)

  const recordsByEmployeeId = useMemo(() => {
    const map: Record<number, AttendanceRecordDTO | null> = {}
    employees.forEach((emp) => {
      map[emp.id] = records.find((rec) => rec.employeeId === emp.id) || null
    })
    return map
  }, [employees, records])

  const filteredEmployees = useMemo(
    () => employees.filter((emp) => !selectedDepartmentId || emp.departmentId === selectedDepartmentId),
    [employees, selectedDepartmentId]
  )

  type DailyRow = Pick<EmployeeDTO, 'id' | 'name' | 'departmentId'> & {
    record: AttendanceRecordDTO | null
  }

  const columns: Column<DailyRow>[] = [
    { header: 'Medarbejder', accessor: (row) => row.name },
    { header: 'Check ind', accessor: (row) => (row.record ? dayjs(row.record.checkIn).format('HH:mm') : '-') },
    {
      header: 'Check ud',
      accessor: (row) => (row.record?.checkOut ? dayjs(row.record.checkOut).format('HH:mm') : '-'),
    },
    {
      header: 'Varighed',
      accessor: (row) => {
        if (!row.record?.checkOut) return '-'
        const minutes = dayjs(row.record.checkOut).diff(dayjs(row.record.checkIn), 'minute')
        return `${Math.floor(minutes / 60)}t ${minutes % 60}m`
      },
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Daglig oversigt</h1>

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Vælg afdeling</label>
          <select
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            value={selectedDepartmentId || ''}
            onChange={(e) => setSelectedDepartmentId(Number(e.target.value) || null)}
            disabled={empLoading}
          >
            <option value="" hidden>
              -- Vælg en afdeling --
            </option>
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Vælg dag</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            disabled={isLoading}
          />
        </div>
      </div>

      {empLoading && <LoadingSpinner size="small" message="Indlæser medarbejdere..." />}
      {empError && <p className="text-red-500">{empError.message}</p>}
      {isLoading && <LoadingSpinner message="Indlæser registreringer..." />}
      {error && <p className="text-red-500">{error.message}</p>}

      {!isLoading && !error && (
        <DataTable
          columns={columns}
          data={filteredEmployees.map((emp) => ({ ...emp, record: recordsByEmployeeId[emp.id] }))}
          rowKey={(row) => row.id}
          emptyMessage="Ingen registreringer fundet for denne dag"
        />
      )}
    </div>
  )
}

export default DailyOverviewPage
