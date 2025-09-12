import axiosInstance from '../api/axios'
import { AbsenceTypeDTO, CompanyDTO, DepartmentDTO, EmployeeTypeDTO, UserDTO } from 'shared'

export const companyService = {
  getAllCompanies: async (): Promise<{ companies: CompanyDTO[] }> => {
    const response = await axiosInstance.get('/companies/all')
    return response.data
  },

  getDepartments: async (companyId: number): Promise<{ departments: DepartmentDTO[] }> => {
    const response = await axiosInstance.get(`/companies/${companyId}/departments`)
    return response.data
  },

  getManagers: async (companyId: number): Promise<{ managers: UserDTO[] }> => {
    const response = await axiosInstance.get(`/companies/${companyId}/managers`)
    return response.data
  },

  getEmployeeTypes: async (companyId: number): Promise<{ employeeTypes: EmployeeTypeDTO[] }> => {
    const response = await axiosInstance.get(`/companies/${companyId}/employee-types`)
    return response.data
  },

  async createDepartment(companyId: number, name: string): Promise<{ department: DepartmentDTO }> {
    const { data } = await axiosInstance.post(`/companies/${companyId}/departments`, { name })
    return data
  },
  async renameDepartment(companyId: number, id: number, name: string): Promise<{ department: DepartmentDTO }> {
    const { data } = await axiosInstance.patch(`/companies/${companyId}/departments/${id}`, { name })
    return data
  },
  async deleteDepartment(companyId: number, id: number): Promise<void> {
    await axiosInstance.delete(`/companies/${companyId}/departments/${id}`)
  },

  async createEmployeeType(companyId: number, name: string): Promise<{ employeeType: EmployeeTypeDTO }> {
    const { data } = await axiosInstance.post(`/companies/${companyId}/employee-types`, { name })
    return data
  },
  async renameEmployeeType(companyId: number, id: number, name: string): Promise<{ employeeType: EmployeeTypeDTO }> {
    const { data } = await axiosInstance.patch(`/companies/${companyId}/employee-types/${id}`, { name })
    return data
  },
  async deleteEmployeeType(companyId: number, id: number): Promise<void> {
    await axiosInstance.delete(`/companies/${companyId}/employee-types/${id}`)
  },

  getAbsenceTypes: async (companyId: number): Promise<{ absenceTypes: AbsenceTypeDTO[] }> => {
    const { data } = await axiosInstance.get(`/companies/${companyId}/absence-types`)
    return data
  },
  createAbsenceType: async (companyId: number, name: string): Promise<{ absenceType: AbsenceTypeDTO }> => {
    const { data } = await axiosInstance.post(`/companies/${companyId}/absence-types`, { name })
    return data
  },
  renameAbsenceType: async (companyId: number, id: number, name: string): Promise<{ absenceType: AbsenceTypeDTO }> => {
    const { data } = await axiosInstance.patch(`/companies/${companyId}/absence-types/${id}`, { name })
    return data
  },
  deleteAbsenceType: async (companyId: number, id: number): Promise<void> => {
    await axiosInstance.delete(`/companies/${companyId}/absence-types/${id}`)
  },
}
