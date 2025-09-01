import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { AbsenceRecord } from 'shared'
import DataTable, { Column } from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { useAbsenceTypes } from '../hooks/useAbsenceTypes'
import { useEmployeeAbsences } from '../hooks/useEmployeeAbsences'
import { employeeService } from '../services/employeeService'
import { toast } from 'react-toastify'
import AbsenceForm, { AbsenceFormValues } from '../components/absence/AbsenceForm'

function toInputDateValue(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const AbsenceOverviewPage = () => {
  const { companyId } = useAuth()
  const {
    data: employees = [],
    isLoading: empLoading,
    isFetching: empFetching,
    error: empError,
  } = useEmployees(companyId)
  const { data: absenceTypes = [] } = useAbsenceTypes(companyId)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)

  const { data: absences = [], isLoading, error, refetch } = useEmployeeAbsences(selectedEmployeeId || undefined)

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  )

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AbsenceRecord | null>(null)

  const openCreate = () => {
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (rec: AbsenceRecord) => {
    setEditing(rec)
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSave = async (v: AbsenceFormValues) => {
    if (!v.employeeId || !v.absenceTypeId || !v.startDate || !v.endDate) {
      toast.error('Udfyld venligst alle felter')
      return
    }
    const s = new Date(v.startDate)
    const e = new Date(v.endDate)
    if (e < s) {
      toast.error('Slutdato kan ikke være før startdato')
      return
    }

    try {
      if (editing) {
        await toast.promise(
          employeeService.updateAbsence(editing.id, {
            absenceTypeId: Number(v.absenceTypeId),
            startDate: s,
            endDate: e,
          }),
          { success: 'Fravær opdateret', error: 'Kunne ikke opdatere fravær' }
        )
      } else {
        await toast.promise(
          employeeService.createAbsence({
            employeeId: Number(v.employeeId),
            absenceTypeId: Number(v.absenceTypeId),
            startDate: s,
            endDate: e,
          }),
          { success: 'Fravær oprettet', error: 'Kunne ikke oprette fravær' }
        )
      }

      setSelectedEmployeeId(Number(v.employeeId))
      closeModal()
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    await toast.promise(employeeService.deleteAbsence(editing.id), {
      success: 'Fravær slettet',
      error: 'Kunne ikke slette fravær',
    })
    setSelectedEmployeeId(editing.employeeId)
    setEditing(null)
    closeModal()
    await refetch()
  }

  const columns: Column<AbsenceRecord>[] = [
    { header: 'Type', accessor: (rec) => rec.absenceType?.name ?? '—' },
    { header: 'Fra', accessor: (rec) => dayjs(rec.startDate).format('DD/MM/YYYY') },
    { header: 'Til', accessor: (rec) => dayjs(rec.endDate).format('DD/MM/YYYY') },
    {
      header: 'Dage',
      accessor: (rec) => dayjs(rec.endDate).diff(dayjs(rec.startDate), 'day') + 1,
      className: 'text-center',
    },
    {
      header: 'Handling',
      accessor: (rec) => (
        <button
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(rec)
          }}
        >
          Rediger
        </button>
      ),
    },
  ]

  const initialForm: AbsenceFormValues = editing
    ? {
        employeeId: editing.employeeId,
        absenceTypeId: editing.absenceTypeId,
        startDate: toInputDateValue(editing.startDate),
        endDate: toInputDateValue(editing.endDate),
      }
    : {
        employeeId: selectedEmployeeId ?? '',
        absenceTypeId: '',
        startDate: '',
        endDate: '',
      }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Fravær</h1>
        <button
          className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
          onClick={openCreate}
        >
          Nyt fravær
        </button>
      </div>

      {/* Page-level employee select */}
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
            Indlæser medarbejdere...
          </div>
        )}
        {empError && <p className="text-red-500">{empError.message || 'Kunne ikke hente medarbejdere'}</p>}
      </div>

      {/* Absence table */}
      {isLoading && <LoadingSpinner message="Indlæser fravær..." />}
      {error && <p className="text-red-500">{(error as Error).message || 'Kunne ikke hente fravær'}</p>}

      {selectedEmployee && !isLoading && !error && (
        <DataTable
          columns={columns}
          data={absences}
          rowKey={(rec) => rec.id}
          emptyMessage="Ingen fravær fundet for denne medarbejder"
        />
      )}

      {/* Modal with AbsenceForm */}
      {showModal && (
        <Modal title={editing ? 'Rediger fravær' : 'Opret fravær'} closeModal={closeModal}>
          <AbsenceForm
            title={editing ? 'Rediger fravær' : 'Opret fravær'}
            employees={employees.map((e) => ({ id: e.id, name: e.name }))}
            absenceTypes={absenceTypes.map((t) => ({ id: t.id, name: t.name }))}
            initialValues={initialForm}
            submitLabel={editing ? 'Gem' : 'Opret'}
            onSubmit={handleSave}
            onCancel={closeModal}
            onDelete={editing ? handleDelete : undefined}
          />
        </Modal>
      )}
    </div>
  )
}

export default AbsenceOverviewPage
