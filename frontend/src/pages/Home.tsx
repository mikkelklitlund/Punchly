import { useCallback } from 'react'
import { useEmployeeModal } from '../hooks/useEmployeeModal'
import EmployeeCard from '../components/employee/EmployeeCard'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { employeeService } from '../services/employeeService'
import { useToast } from '../contexts/ToastContext'
import EmployeeList from '../components/employee/EmployeeList'
import { useCompany } from '../contexts/CompanyContext'

function Home() {
  const { employees, isLoading, error, refreshEmployees } = useCompany()
  const { showToast } = useToast()

  const handleCheckAction = useCallback(
    async (employeeId: number, checkIn: boolean) => {
      try {
        const service = checkIn ? employeeService.checkIn : employeeService.checkOut
        const result = await service(employeeId)

        if (result.success) {
          showToast(`Medarbejder ${checkIn ? 'er tjekket ind' : 'er tjekket ud'}`, 'success')
        } else if (result.message) {
          showToast(result.message, 'warning')
        }
      } catch (error) {
        showToast(`Der skete en fejl under ${checkIn ? 'tjek ind' : 'tjek ud'}`, 'error')
        console.error('Failed to update employee status:', error)
      } finally {
        refreshEmployees()
      }
    },
    [showToast, refreshEmployees]
  )

  const { selectedEmployee, showModal, openModal, closeModal } = useEmployeeModal(() => {})

  if (isLoading && employees.length === 0) {
    return <LoadingSpinner fullScreen message="Loading employees..." />
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <p className="mb-4 text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-8 sm:gap-10 lg:justify-start lg:gap-12">
      {isLoading && employees.length > 0 && (
        <div className="fixed bottom-4 left-4 z-10">
          <LoadingSpinner size="small" message="Refreshing..." />
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
