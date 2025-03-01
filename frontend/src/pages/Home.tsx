import { useCallback } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import { useEmployeeModal } from '../hooks/useEmployeeModal'
import EmployeeCard from '../components/employee/EmployeeCard'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { employeeService } from '../services/employeeService'
import { useToast } from '../contexts/ToastContext'
import EmployeeList from '../components/employee/EmployeeList'

function Home() {
  const { employees, isLoading, error, refresh } = useEmployees()
  const { showToast } = useToast()

  const handleCheckAction = useCallback(
    async (employeeId: number, checkIn: boolean) => {
      try {
        const service = checkIn ? employeeService.checkIn : employeeService.checkOut
        const result = await service(employeeId)

        if (result.success) {
          showToast(`Medarbejder ${checkIn ? 'er tjekket ind' : 'er tjekket ud'}`, 'success')
          await refresh()
        } else if (result.message) {
          showToast(result.message, 'warning')
        }
      } catch (error) {
        showToast(`Der skete en fejl under ${checkIn ? 'tjek ind' : 'tjek ud'}`, 'error')
        console.error('Failed to update employee status:', error)
      }
    },
    [refresh, showToast]
  )

  // eslint-disable-next-line max-len
  const { selectedEmployee, showModal, openModal, closeModal } = useEmployeeModal(() => {}) // Empty callback since we handle refresh separately

  if (isLoading && employees.length === 0) {
    return <LoadingSpinner fullScreen message="Loading employees..." />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 bg-mustard text-white rounded hover:bg-burnt">
          Prøv igen
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-8 sm:gap-10 lg:gap-12 justify-center lg:justify-start">
      {isLoading && employees.length > 0 && (
        <div className="fixed bottom-4 left-4 z-10">
          <LoadingSpinner size="small" message="Refreshing..." />
        </div>
      )}

      <EmployeeList employees={employees} onEmployeeClick={openModal} />

      {showModal && selectedEmployee && (
        <Modal closeModal={closeModal} title={selectedEmployee.name}>
          <EmployeeCard employee={selectedEmployee} />
          <div className="w-full flex justify-evenly mt-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={() => {
                handleCheckAction(selectedEmployee.id, false)
                closeModal()
              }}
            >
              Tjek ud
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
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
