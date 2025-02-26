import { useState } from 'react'
import { SimpleEmployee } from 'shared'
import { employeeService } from '../services/employeeService'

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
      let data
      if (checkIn) data = await employeeService.checkIn(selectedEmployee.id)
      else data = await employeeService.checkOut(selectedEmployee.id)
      if (!data.success) {
        alert(data.message)
      }
      await updateData()
    } catch (error) {
      console.error('Failed to update employee status:', error)
    }
    closeModal()
  }

  return { selectedEmployee, showModal, openModal, closeModal, checkAction }
}
