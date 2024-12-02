import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { SimpleEmployee } from 'shared'
import EmployeeCard from '../components/EmployeeCard'

function Home() {
  const { user, isLoading, companyId } = useAuth()
  const [employees, setEmployees] = useState<SimpleEmployee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<SimpleEmployee | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string>()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return

      try {
        const result = await axios.get(`/companies/${companyId}/simple-employees`)
        setEmployees(result.data.employees)
      } catch (err) {
        console.error('Failed to fetch employees:', err)
        setError('Could not fetch employees. Please try again later.')
      }
    }

    const fetchData = async () => {
      if (!isLoading && !user) {
        navigate('/login')
      } else if (companyId) {
        await fetchEmployees()
      }
    }

    fetchData()
  }, [companyId, isLoading, user, navigate])

  const openModal = (employee: SimpleEmployee) => {
    setSelectedEmployee(employee)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedEmployee(null)
    setShowModal(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="flex flex-wrap gap-8 p-4 sm:gap-10 sm:p-6 lg:gap-12 lg:p-8 justify-center lg:justify-start">
      {employees.length > 0 ? (
        employees.map((em) => (
          <button key={em.id} onClick={() => openModal(em)} className="transition-transform transform hover:scale-105">
            <EmployeeCard employee={em} />
          </button>
        ))
      ) : (
        <p className="text-center w-full">Ingen medarbejdere fundet</p>
      )}

      {showModal && selectedEmployee && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg lg:w-1/3 w-1/2 relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <EmployeeCard employee={selectedEmployee} />
            <div className="w-full flex justify-evenly mt-4">
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Tjek ud</button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Tjek ind</button>
            </div>
            {/* Close Button */}
            <button onClick={closeModal} className="absolute top-0 right-2 text-gray-500 hover:text-black text-2xl">
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
