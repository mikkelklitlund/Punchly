import axiosInstance from '../api/axios'
import { AbsenceTypeDTO, CompanyDTO, DepartmentDTO, EmployeeTypeDTO, UserDTO } from 'shared'

export const companyService = {
  async getAllCompanies(): Promise<{ companies: CompanyDTO[] }> {
    const response = await axiosInstance.get('/companies/all')
    return response.data
  },

  async getDepartments(companyId: number): Promise<{ departments: DepartmentDTO[] }> {
    const response = await axiosInstance.get(`/companies/${companyId}/departments`)
    return response.data
  },

  async getManagers(companyId: number): Promise<{ managers: UserDTO[] }> {
    const response = await axiosInstance.get(`/companies/${companyId}/managers`)
    return response.data
  },

  async getEmployeeTypes(companyId: number): Promise<{ employeeTypes: EmployeeTypeDTO[] }> {
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

  async getAbsenceTypes(companyId: number): Promise<{ absenceTypes: AbsenceTypeDTO[] }> {
    const { data } = await axiosInstance.get(`/companies/${companyId}/absence-types`)
    return data
  },
  async createAbsenceType(companyId: number, name: string): Promise<{ absenceType: AbsenceTypeDTO }> {
    const { data } = await axiosInstance.post(`/companies/${companyId}/absence-types`, { name })
    return data
  },
  async renameAbsenceType(companyId: number, id: number, name: string): Promise<{ absenceType: AbsenceTypeDTO }> {
    const { data } = await axiosInstance.patch(`/companies/${companyId}/absence-types/${id}`, { name })
    return data
  },
  async deleteAbsenceType(companyId: number, id: number): Promise<void> {
    await axiosInstance.delete(`/companies/${companyId}/absence-types/${id}`)
  },
}
