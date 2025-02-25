import { useState } from 'react'
import { SimpleEmployee } from 'shared'
import axios from '../api/axios'

export function useEmployeeModal(updateData: () => void) {
  const [selectedEmployee, setSelectedEmployee] = useState<SimpleEmployee | null>(null)
  const [showModal, setShowModal] = useState(false)

  const openModal = (employee: SimpleEmployee) => {
    setSelectedEmployee(employee)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedEmployee(null)
    setShowModal(false)
  }

  const checkAction = async (checkIn: boolean) => {
    if (!selectedEmployee) return
    try {
      const result = await axios.post(`/employees/${selectedEmployee.id}/${checkIn ? 'checkin' : 'checkout'}`)
      if (!result.data.success) {
        alert(result.data.message)
      }
      await updateData()
    } catch (error) {
      console.error('Failed to update employee status:', error)
    }
    closeModal()
  }

  return { selectedEmployee, showModal, openModal, closeModal, checkAction }
}
