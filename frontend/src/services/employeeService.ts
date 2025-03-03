import axiosInstance from '../api/axios'
import { SimpleEmployee } from 'shared'

export interface EmployeeResponse {
  employees: SimpleEmployee[]
  total: number
}

export const employeeService = {
  getEmployees: async (companyId: number, departmentId?: number): Promise<EmployeeResponse> => {
    const endpoint = departmentId
      ? `/companies/${companyId}/${departmentId}/simple-employees`
      : `/companies/${companyId}/simple-employees`

    const response = await axiosInstance.get(endpoint)
    return response.data
  },

  checkIn: async (employeeId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post(`/employees/${employeeId}/checkin`)
    return response.data
  },

  checkOut: async (employeeId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post(`/employees/${employeeId}/checkout`)
    return response.data
  },
}
