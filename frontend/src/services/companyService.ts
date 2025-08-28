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

  async createDepartment(companyId: number, name: string): Promise<{ department: Department }> {
    const { data } = await axiosInstance.post(`/companies/${companyId}/departments`, { name })
    return data
  },
  async renameDepartment(companyId: number, id: number, name: string): Promise<{ department: Department }> {
    const { data } = await axiosInstance.patch(`/companies/${companyId}/departments/${id}`, { name })
    return data
  },
  async deleteDepartment(companyId: number, id: number): Promise<void> {
    await axiosInstance.delete(`/companies/${companyId}/departments/${id}`)
  },

  async createEmployeeType(companyId: number, name: string): Promise<{ employeeType: EmployeeType }> {
    const { data } = await axiosInstance.post(`/companies/${companyId}/employee-types`, { name })
    return data
  },
  async renameEmployeeType(companyId: number, id: number, name: string): Promise<{ employeeType: EmployeeType }> {
    const { data } = await axiosInstance.patch(`/companies/${companyId}/employee-types/${id}`, { name })
    return data
  },
  async deleteEmployeeType(companyId: number, id: number): Promise<void> {
    await axiosInstance.delete(`/companies/${companyId}/employee-types/${id}`)
  },
}
