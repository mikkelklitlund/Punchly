import { useState } from 'react'
import { useEmployeeAbsences } from '../hooks/useEmployeeAbsences'
import { AbsenceRecord } from 'shared'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../contexts/AuthContext'
import DataTable, { Column } from '../components/common/DataTable'
import dayjs from 'dayjs'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import EditAbsenceForm from '../components/absence/EditAbsenceForm'

const AbsenceOverviewPage = () => {
  const { companyId } = useAuth()
  const { data: employees = [], isLoading: empLoading, error: empError } = useEmployees(companyId, { live: false })
  const [editRecord, setEditRecord] = useState<AbsenceRecord | null>(null)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const { data: records = [], isLoading, error, refetch } = useEmployeeAbsences(selectedEmployeeId || undefined)

  const columns: Column<AbsenceRecord>[] = [
    {
      header: 'Første fraværs dag',
      accessor: (rec) => {
        return dayjs(rec.startDate).format('DD/MM/YYYY')
      },
    },
    {
      header: 'Sidste fraværs dag',
      accessor: (rec) => {
        return dayjs(rec.endDate).format('DD/MM/YYYY')
      },
    },
    {
      header: 'Antal dage',
      accessor: (rec) => {
        return dayjs(rec.endDate).diff(dayjs(rec.startDate), 'd') + 1
      },
    },
    {
      header: 'Type',
      accessor: (rec) => {
        return rec.absenceType.name
      },
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Fravær</h1>

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

        {empLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <LoadingSpinner size="small" />
            Indlæser medarbejdere...
          </div>
        )}
        {empError && <p className="text-red-500">{empError.message || 'Kunne ikke hente medarbejdere'}</p>}
      </div>

      {isLoading && <LoadingSpinner message="Indlæser fravær..." />}
      {error && <p className="text-red-500">{error.message || 'Kunne ikke hente fravær'}</p>}

      {selectedEmployeeId && !isLoading && !error && (
        <DataTable
          columns={columns}
          data={records}
          rowKey={(rec) => rec.id}
          onRowClick={(rec) => {
            setEditRecord(rec)
          }}
          emptyMessage="Ingen fravær fundet for denne medarbejder de sidste 30 dage"
        />
      )}

      {editRecord && (
        <Modal title="Rediger Fravær" closeModal={() => setEditRecord(null)}>
          <EditAbsenceForm
            absenceRec={editRecord}
            onSuccess={() => {
              refetch()
              setEditRecord(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

export default AbsenceOverviewPage
