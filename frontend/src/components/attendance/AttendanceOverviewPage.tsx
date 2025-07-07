import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { AttendanceRecord } from 'shared'
import { useCompany } from '../../contexts/CompanyContext'
import { employeeService } from '../../services/employeeService'
import DataTable from '../common/DataTable'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'
import EditAttendanceForm from './EditAttendanceForm'

dayjs.extend(duration)

const AttendanceOverviewPage = () => {
  const { employees } = useCompany()

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  const fetchRecords = async (employeeId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await employeeService.getAttendanceRecords(employeeId)
      setRecords(data)
    } catch (err) {
      setError('Kunne ikke hente registreringer')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchRecords(selectedEmployeeId)
    } else {
      setRecords([])
    }
  }, [selectedEmployeeId])

  const columns = [
    {
      header: 'Check ind',
      accessor: (rec: AttendanceRecord) => dayjs(rec.checkIn).format('DD/MM/YYYY HH:mm'),
    },
    {
      header: 'Check ud',
      accessor: (rec: AttendanceRecord) => (rec.checkOut ? dayjs(rec.checkOut).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      header: 'Varighed',
      accessor: (rec: AttendanceRecord) => {
        if (!rec.checkOut) return '-'
        const diff = dayjs(rec.checkOut).diff(dayjs(rec.checkIn), 'minute')
        return `${Math.floor(diff / 60)}t ${diff % 60}m`
      },
    },
    {
      header: 'Auto-lukket',
      accessor: (rec: AttendanceRecord) =>
        rec.autoClosed ? (
          <CheckCircle className="inline-block text-green-600" size={18} />
        ) : (
          <XCircle className="inline-block text-red-500" size={18} />
        ),
      className: 'text-center',
    },
  ]

  const handleRowClick = (rec: AttendanceRecord) => {
    setEditRecord(rec)
  }

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
        >
          <option value="">-- Vælg en medarbejder --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingSpinner message="Indlæser registreringer..." />}
      {error && <p className="text-red-500">{error}</p>}

      {selectedEmployee && !isLoading && !error && (
        <DataTable
          columns={columns}
          data={records}
          rowKey={(rec) => rec.id}
          onRowClick={handleRowClick}
          emptyMessage="Ingen registreringer fundet for denne medarbejder"
        />
      )}

      {editRecord && (
        <Modal title="Rediger registrering" closeModal={() => setEditRecord(null)}>
          <EditAttendanceForm
            record={editRecord}
            onSuccess={() => {
              if (selectedEmployeeId) fetchRecords(selectedEmployeeId)
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
