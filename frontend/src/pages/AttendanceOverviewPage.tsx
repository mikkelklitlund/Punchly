import { useMemo, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { AttendanceRecord } from 'shared'
import DataTable, { Column } from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import EditAttendanceForm from '../components/attendance/EditAttendanceForm'
import { useAuth } from '../contexts/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { useAttendanceRecords } from '../hooks/useAttendanceRecords'

dayjs.extend(duration)

const AttendanceOverviewPage = () => {
  const { companyId } = useAuth()

  const {
    data: employees = [],
    isLoading: empLoading,
    isFetching: empFetching,
    error: empError,
  } = useEmployees(companyId)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)
  const { data: records = [], isLoading, error, refetch } = useAttendanceRecords(selectedEmployeeId || undefined)

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  )

  const columns: Column<AttendanceRecord>[] = [
    {
      header: 'Dato',
      accessor: (rec: AttendanceRecord) => {
        const inD = dayjs(rec.checkIn)
        if (!rec.checkOut) return inD.format('DD/MM/YYYY')
        const outD = dayjs(rec.checkOut)
        return inD.isSame(outD, 'day')
          ? inD.format('DD/MM/YYYY')
          : `${inD.format('DD/MM/YYYY')} - ${outD.format('DD/MM/YYYY')}`
      },
    },
    {
      header: 'Check ind',
      accessor: (rec: AttendanceRecord) => dayjs(rec.checkIn).format('HH:mm'),
    },
    {
      header: 'Check ud',
      accessor: (rec: AttendanceRecord) => (rec.checkOut ? dayjs(rec.checkOut).format('HH:mm') : '-'),
    },
    {
      header: 'Varighed',
      accessor: (rec: AttendanceRecord) => {
        if (!rec.checkOut) return '-'
        const minutes = dayjs(rec.checkOut).diff(dayjs(rec.checkIn), 'minute')
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return `${h}t ${m}m`
      },
    },
    {
      header: 'Skal gennemgås',
      accessor: (rec: AttendanceRecord) =>
        rec.autoClosed ? (
          <CheckCircle className="inline-block text-orange-500" size={18} />
        ) : (
          <XCircle className="inline-block text-gray-400" size={18} />
        ),
      className: 'text-center',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Registrerede tider</h1>

      <div className="space-y-2">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
          Vælg medarbejder
        </label>
        <select
          id="employee"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          onChange={(e) => setSelectedEmployeeId(Number(e.target.value) || null)}
          value={selectedEmployeeId || ''}
          disabled={empLoading}
        >
          <option value="" hidden>
            -- Vælg en medarbejder --
          </option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        {(empLoading || empFetching) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <LoadingSpinner size="small" />
            Indlæser medarbejdere…
          </div>
        )}
        {empError && <p className="text-red-500">{empError.message || 'Kunne ikke hente medarbejdere'}</p>}
      </div>

      {isLoading && <LoadingSpinner message="Indlæser registreringer..." />}
      {error && <p className="text-red-500">{error.message || 'Kunne ikke hente registreringer'}</p>}

      {selectedEmployee && !isLoading && !error && (
        <DataTable
          columns={columns}
          data={records}
          rowKey={(rec) => rec.id}
          onRowClick={(rec) => {
            setEditRecord(rec)
          }}
          emptyMessage="Ingen registreringer fundet for denne medarbejder"
        />
      )}

      {editRecord && (
        <Modal title="Rediger registrering" closeModal={() => setEditRecord(null)}>
          <EditAttendanceForm
            record={editRecord}
            onSuccess={() => {
              refetch()
              setEditRecord(null)
            }}
            onCancel={() => setEditRecord(null)}
          />
        </Modal>
      )}
    </div>
  )
}

export default AttendanceOverviewPage
