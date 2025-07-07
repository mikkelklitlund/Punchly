import axiosInstance from '../api/axios'
import { Company, Department, EmployeeType, User } from 'shared'

export const companyService = {
  getAllCompanies: async (): Promise<{ companies: Company[] }> => {
    const response = await axiosInstance.get('/companies/all')
    return response.data
  },

  getDepartments: async (companyId: number): Promise<{ departments: Department[] }> => {
    const response = await axiosInstance.get(`/companies/${companyId}/departments`)
    return response.data
  },

  getManagers: async (companyId: number): Promise<{ managers: User[] }> => {
    const response = await axiosInstance.get(`/companies/${companyId}/managers`)
    return response.data
  },

  getEmployeeTypes: async (companyId: number): Promise<{ employeeTypes: EmployeeType[] }> => {
    const response = await axiosInstance.get(`/companies/${companyId}/employee-types`)
    return response.data
  },
}
