import { useEffect, useState } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { employeeService } from '../services/employeeService'
import Modal from '../components/common/Modal'
import EditEmployeeForm from '../components/employee/EditEmployeeForm'
import { getProfilePictureUrl } from '../utils/imageUtils'
import DataTable, { Column } from '../components/common/DataTable'
import { EmployeeDTO, SimpleEmployeeDTO } from 'shared'
import { toast } from 'react-toastify'

const EmployeeTable = () => {
  const { employees, isLoading, error, departments, setCurrentDepartment } = useCompany()
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDTO | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setCurrentDepartment(undefined)
  }, [setCurrentDepartment])

  const openEditModal = async (id: number) => {
    try {
      const employee = await employeeService.getEmployeeById(id)
      setSelectedEmployee(employee)
      setShowModal(true)
    } catch (err) {
      console.error(err)
      toast.error('Kunne ikke hente medarbejderens data')
    }
  }

  const closeModal = () => {
    setSelectedEmployee(null)
    setShowModal(false)
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    const depA = departments.find((d) => d.id === a.departmentId)?.name || ''
    const depB = departments.find((d) => d.id === b.departmentId)?.name || ''
    return depA.localeCompare(depB)
  })

  const columns: Column<SimpleEmployeeDTO>[] = [
    {
      header: 'Navn',
      accessor: (emp: SimpleEmployeeDTO) => (
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
      accessor: (emp: SimpleEmployeeDTO) => departments.find((dp) => dp.id === emp.departmentId)?.name ?? '-',
    },
    {
      header: 'Status',
      accessor: (emp: SimpleEmployeeDTO) => (
        <span className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${emp.checkedIn ? 'bg-green-500' : 'bg-red-500'}`} />
          {emp.checkedIn ? 'Tjekket ind' : 'Ikke tjekket ind'}
        </span>
      ),
    },
    {
      header: 'Handling',
      accessor: (emp: SimpleEmployeeDTO) => (
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
        <h2 className="mb-4 text-xl font-semibold">Medarbejderliste</h2>
        <DataTable
          columns={columns}
          data={sortedEmployees}
          rowKey={(emp) => emp.id}
          isLoading={isLoading && employees.length === 0}
          error={error}
          emptyMessage="Ingen medarbejdere fundet"
          onRowClick={(emp) => openEditModal(emp.id)}
        />
      </div>

      {showModal && selectedEmployee && (
        <Modal title="Rediger medarbejder" closeModal={closeModal}>
          <EditEmployeeForm employee={selectedEmployee} onSuccess={closeModal} />
        </Modal>
      )}
    </>
  )
}

export default EmployeeTable
