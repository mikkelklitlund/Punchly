import { useCallback } from 'react'
import { useEmployeeModal } from '../hooks/useEmployeeModal'
import EmployeeCard from '../components/employee/EmployeeCard'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { employeeService } from '../services/employeeService'
import EmployeeList from '../components/employee/EmployeeList'
import { useCompany } from '../contexts/CompanyContext'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'

const Home = () => {
  const { companyId } = useAuth()
  const { currentDepartment } = useCompany()

  const { data: employees = [], isLoading, isFetching, error, refetch } = useEmployees(companyId, currentDepartment?.id)

  const handleCheckAction = useCallback(
    async (employeeId: number, checkIn: boolean) => {
      const opText = checkIn ? 'tjek ind' : 'tjek ud'
      try {
        await toast.promise(
          (async () => {
            const res = await (checkIn ? employeeService.checkIn : employeeService.checkOut)(employeeId)
            if (!res.success) {
              throw new Error(res.message || `Kunne ikke ${opText}`)
            }
            return res
          })(),
          {
            pending: checkIn ? 'Tjekker ind…' : 'Tjekker ud…',
            success: checkIn ? 'Medarbejder er tjekket ind' : 'Medarbejder er tjekket ud',
            error: {
              render({ data }) {
                return (data as Error)?.message || `Der skete en fejl under ${opText}`
              },
            },
          }
        )
      } finally {
        refetch()
      }
    },
    [refetch]
  )

  const { selectedEmployee, showModal, openModal, closeModal } = useEmployeeModal(() => {})

  if (isLoading && employees.length === 0) {
    return <LoadingSpinner fullScreen message="Loading employees..." />
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <p className="mb-4 text-red-500">{error.message || 'Der opstod en fejl ved indlæsning af medarbejdere.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-8 sm:gap-10 lg:justify-start lg:gap-12">
      {isFetching && employees.length > 0 && (
        <div className="fixed bottom-4 left-4 z-10">
          <LoadingSpinner size="small" message="Indlæser..." />
        </div>
      )}

      <EmployeeList employees={employees} onEmployeeClick={openModal} />

      {showModal && selectedEmployee && (
        <Modal closeModal={closeModal} title={selectedEmployee.name}>
          <EmployeeCard employee={selectedEmployee} />
          <div className="mt-4 flex w-full justify-evenly">
            <button
              className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              onClick={() => {
                handleCheckAction(selectedEmployee.id, false)
                closeModal()
              }}
            >
              Tjek ud
            </button>
            <button
              className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              onClick={() => {
                handleCheckAction(selectedEmployee.id, true)
                closeModal()
              }}
            >
              Tjek ind
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Home
