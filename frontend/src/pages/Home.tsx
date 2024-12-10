import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { SimpleEmployee } from 'shared'
import EmployeeCard from '../components/EmployeeCard'
import Modal from '../components/Modal'
import { useAppContext } from '../contexts/AppContext'

function Home() {
  const { user, isLoading, companyId } = useAuth()
  const { currentDepartment } = useAppContext()
  const [employees, setEmployees] = useState<SimpleEmployee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<SimpleEmployee | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string>()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return

      try {
        let sortedEmployees = []

        if (currentDepartment) {
          const result = await axios.get(`/companies/${companyId}/${currentDepartment.id}/simple-employees`)
          sortedEmployees = result.data.employees
            .filter((em: SimpleEmployee) => em.departmentId === currentDepartment.id)
            .sort((a: SimpleEmployee, b: SimpleEmployee) => (a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1))
        } else {
          const result = await axios.get(`/companies/${companyId}/simple-employees`)
          sortedEmployees = result.data.employees.sort((a: SimpleEmployee, b: SimpleEmployee) =>
            a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1
          )
        }
        setEmployees(sortedEmployees)
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
  }, [companyId, isLoading, user, navigate, currentDepartment])

  const updateData = async () => {
    let sortedEmployees = []

    if (currentDepartment) {
      const result = await axios.get(`/companies/${companyId}/${currentDepartment.id}/simple-employees`)
      sortedEmployees = result.data.employees
        .filter((em: SimpleEmployee) => em.departmentId === currentDepartment.id)
        .sort((a: SimpleEmployee, b: SimpleEmployee) => (a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1))
    } else {
      const result = await axios.get(`/companies/${companyId}/simple-employees`)
      sortedEmployees = result.data.employees.sort((a: SimpleEmployee, b: SimpleEmployee) =>
        a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1
      )
    }
    setEmployees(sortedEmployees)
  }

  const openModal = (employee: SimpleEmployee) => {
    setSelectedEmployee(employee)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedEmployee(null)
    setShowModal(false)
  }

  const checkAction = async (checkIn: boolean) => {
    if (!selectedEmployee) {
      return
    }
    let succes = false
    let result
    if (checkIn) {
      result = await axios.post(`/employees/${selectedEmployee.id}/checkin`)
      succes = result.data.success
    } else {
      result = await axios.post(`/employees/${selectedEmployee.id}/checkout`)
      succes = result.data.success
    }
    if (!succes) {
      alert(result.data.message)
    }
    await updateData()
    closeModal()
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
          <button
            key={em.id}
            onClick={() => openModal(em)}
            className={`transition-transform transform hover:scale-105 rounded-lg p-4 ${
              em.checkedIn ? 'bg-green-200 hover:bg-green-300' : 'bg-red-200 hover:bg-red-300'
            }`}
          >
            <EmployeeCard employee={em} />
          </button>
        ))
      ) : (
        <p className="text-center w-full">Ingen medarbejdere fundet</p>
      )}

      {showModal && selectedEmployee && (
        <Modal
          closeModal={closeModal}
          children={
            <>
              <EmployeeCard employee={selectedEmployee} />
              <div className="w-full flex justify-evenly mt-4">
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  onClick={() => {
                    checkAction(false)
                  }}
                >
                  Tjek ud
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  onClick={() => {
                    checkAction(true)
                  }}
                >
                  Tjek ind
                </button>
              </div>
            </>
          }
        ></Modal>
      )}
    </div>
  )
}

export default Home
