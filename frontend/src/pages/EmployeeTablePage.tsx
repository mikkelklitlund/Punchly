import { useEffect, useState, useMemo } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { Employee, SimpleEmployee } from 'shared'
import { employeeService } from '../services/employeeService'
import Modal from '../components/common/Modal'
import EditEmployeeForm from '../components/employee/EditEmployeeForm'
import CreateEmployeeForm from '../components/employee/CreateEmployeeForm'
import { getProfilePictureUrl } from '../utils/imageUtils'
import DataTable, { Column } from '../components/common/DataTable'
import { toast } from 'react-toastify'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

const EmployeeTablePage = () => {
  const { companyId } = useAuth()
  const { currentDepartment, setCurrentDepartment, departments } = useCompany()

  const { data: employees = [], isLoading, isFetching, error, refetch } = useEmployees(companyId, currentDepartment?.id)

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    setCurrentDepartment(undefined)
  }, [setCurrentDepartment])

  const openEditModal = async (id: number) => {
    try {
      const employee = await toast.promise(employeeService.getEmployeeById(id), {
        error: 'Kunne ikke hente medarbejderens data',
      })
      setSelectedEmployee(employee)
      setShowEditModal(true)
    } catch (err) {
      console.error(err)
    }
  }

  const closeEditModal = () => {
    setSelectedEmployee(null)
    setShowEditModal(false)
  }

  const sortedEmployees = useMemo(() => {
    if (!employees?.length) return []
    const depNameById = new Map(departments.map((d) => [d.id, d.name]))
    return [...employees].sort((a, b) => {
      const depA = depNameById.get(a.departmentId) || ''
      const depB = depNameById.get(b.departmentId) || ''
      return depA.localeCompare(depB)
    })
  }, [employees, departments])

  const columns: Column<SimpleEmployee>[] = [
    {
      header: 'Navn',
      accessor: (emp) => (
        <div className="flex items-center space-x-3">
          <img
            src={getProfilePictureUrl(emp.profilePicturePath)}
            alt={emp.name}
            className="h-10 w-10 rounded-full object-cover shadow"
          />
          <span>{emp.name}</span>
        </div>
      ),
    },
    {
      header: 'Afdeling',
      accessor: (emp) => departments.find((dp) => dp.id === emp.departmentId)?.name ?? '-',
    },
    {
      header: 'Status',
      accessor: (emp) => (
        <span className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${emp.checkedIn ? 'bg-green-500' : 'bg-red-500'}`} />
          {emp.checkedIn ? 'Tjekket ind' : 'Ikke tjekket ind'}
        </span>
      ),
    },
    {
      header: 'Handling',
      accessor: (emp) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            openEditModal(emp.id)
          }}
          className="bg-rust hover:bg-rust/80 rounded-md px-3 py-1 text-sm text-white"
        >
          Rediger
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="w-full p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Medarbejderliste</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
          >
            Ny medarbejder
          </button>
        </div>

        {isFetching && employees.length > 0 && (
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
            <LoadingSpinner size="small" />
            Opdaterer...
          </div>
        )}

        <DataTable
          columns={columns}
          data={sortedEmployees}
          rowKey={(emp) => emp.id}
          isLoading={isLoading && employees.length === 0}
          error={error?.message || null}
          emptyMessage="Ingen medarbejdere fundet"
          onRowClick={(emp) => openEditModal(emp.id)}
        />
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <Modal title="Ny medarbejder" closeModal={() => setShowCreateModal(false)}>
          <CreateEmployeeForm
            onSuccess={() => {
              setShowCreateModal(false)
              refetch()
            }}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {showEditModal && selectedEmployee && (
        <Modal title="Rediger medarbejder" closeModal={closeEditModal}>
          <EditEmployeeForm
            employee={selectedEmployee}
            onSuccess={() => {
              closeEditModal()
              refetch()
            }}
          />
        </Modal>
      )}
    </>
  )
}

export default EmployeeTablePage
