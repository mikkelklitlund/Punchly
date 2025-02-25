import { useAuth } from '../contexts/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { useEmployeeModal } from '../hooks/useEmployeeModal'
import EmployeeList from '../components/EmployeeList'
import EmployeeCard from '../components/EmployeeCard'
import Modal from '../components/Modal'

function Home() {
  const { isLoading } = useAuth()
  const { employees, error, fetchEmployees } = useEmployees()
  const { selectedEmployee, showModal, openModal, closeModal, checkAction } = useEmployeeModal(fetchEmployees)

  if (isLoading) return <div>Loading...</div>

  if (error) return <div>{error}</div>

  return (
    <div className="flex flex-wrap gap-8 p-4 sm:gap-10 sm:p-6 lg:gap-12 lg:p-8 justify-center lg:justify-start">
      <EmployeeList employees={employees} onEmployeeClick={openModal} />

      {showModal && selectedEmployee && (
        <Modal closeModal={closeModal}>
          <EmployeeCard employee={selectedEmployee} />
          <div className="w-full flex justify-evenly mt-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={() => checkAction(false)}
            >
              Tjek ud
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={() => checkAction(true)}
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
