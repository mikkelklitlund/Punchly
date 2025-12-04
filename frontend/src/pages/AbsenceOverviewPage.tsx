import { useState } from 'react'
import { useEmployeeAbsences } from '../hooks/useEmployeeAbsences'
import { AbsenceRecordDTO } from 'shared'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../contexts/AuthContext'
import DataTable, { Column } from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import EditAbsenceForm from '../components/absence/EditAbsenceForm'
import CreateAbsenceForm from '../components/absence/CreateAbsenceForm'
import { useCompany } from '../contexts/CompanyContext'
import { format, subDays, differenceInBusinessDays } from 'date-fns'

const AbsenceOverviewPage = () => {
  const { companyId } = useAuth()
  const { departments } = useCompany()

  const { data: employees = [], isLoading: empLoading, error: empError } = useEmployees(companyId, { live: false })
  const [editRecord, setEditRecord] = useState<AbsenceRecordDTO | null>(null)
  const [createRecord, setCreateRecord] = useState<boolean>(false)
  const [selectedStartDate, setSelectedStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [selectedEndDate, setSelectedEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const {
    data: records = [],
    isLoading,
    error,
    refetch,
  } = useEmployeeAbsences(selectedStartDate, selectedEndDate, selectedEmployeeId || undefined)

  const columns: Column<AbsenceRecordDTO>[] = [
    {
      header: 'Første fraværs dag',
      accessor: (rec) => {
        return format(new Date(rec.startDate), 'dd/MM/yyyy')
      },
    },
    {
      header: 'Sidste fraværs dag',
      accessor: (rec) => {
        return format(new Date(rec.endDate), 'dd/MM/yyyy')
      },
    },
    {
      header: 'Antal hverdage',
      accessor: (rec) => {
        return differenceInBusinessDays(new Date(rec.startDate), new Date(rec.endDate))
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
        <div className="flex items-end justify-between">
          <div className="flex gap-3">
            <div className="flex gap-3">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Vælg afdeling
                </label>
                <select
                  id="department"
                  className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
                  value={selectedDepartmentId || ''}
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
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                  Vælg medarbejder
                </label>
                <select
                  id="employee"
                  className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  value={selectedEmployeeId || ''}
                  disabled={empLoading}
                >
                  <option value="" hidden>
                    -- Vælg en medarbejder --
                  </option>
                  {employees
                    .filter((emp) => !selectedDepartmentId || emp.departmentId === selectedDepartmentId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          <button className="btn btn-rust" onClick={() => setCreateRecord(true)}>
            Nyt fravær
          </button>
        </div>

        <div className="flex gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start dato</label>
            <input
              type="date"
              value={selectedStartDate}
              onChange={(e) => setSelectedStartDate(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slut dato</label>
            <input
              type="date"
              value={selectedEndDate}
              onChange={(e) => setSelectedEndDate(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-end">
            <button className="btn btn-rust" onClick={() => refetch()} disabled={isLoading || !selectedEmployeeId}>
              Hent
            </button>
          </div>
        </div>

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
          emptyMessage="Ingen fravær fundet for denne medarbejder i valgte tidsperiode"
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

      {createRecord && (
        <Modal title="Opret Fravær" closeModal={() => setCreateRecord(false)}>
          <CreateAbsenceForm
            onSuccess={() => {
              refetch()
              setCreateRecord(false)
            }}
            onCancel={() => setCreateRecord(false)}
          />
        </Modal>
      )}
    </div>
  )
}

export default AbsenceOverviewPage
