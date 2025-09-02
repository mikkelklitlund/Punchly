import axiosInstance from '../api/axios'
import { SimpleEmployee, Employee, AttendanceRecord, CreateEmployee, AbsenceRecord, CreateAbsenceRecord } from 'shared'

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

  async createEmployee(payload: Omit<CreateEmployee, 'profilePicturePath'>): Promise<Employee> {
    const res = await axiosInstance.post<{ employee: Employee }>('/employees', payload)
    return res.data.employee
  },

  async deleteEmployee(id: number): Promise<void> {
    await axiosInstance.delete(`/employees/${id}`)
  },

  checkIn: async (employeeId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post(`/employees/${employeeId}/checkin`)
    return response.data
  },

  checkOut: async (employeeId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post(`/employees/${employeeId}/checkout`)
    return response.data
  },

  async getEmployeeById(id: number): Promise<Employee> {
    const res = await axiosInstance.get<{ employee: Employee }>(`/employees/${id}`)
    return res.data.employee
  },

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const res = await axiosInstance.put<{ employee: Employee }>(`/employees/${id}`, data)
    return res.data.employee
  },

  async uploadProfilePicture(employeeId: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('profilePicture', file)

    const res = await axiosInstance.post<{ profilePictureUrl: string }>(
      `/employees/upload-profile-picture/${employeeId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return res.data.profilePictureUrl
  },

  getAttendanceRecords: async (employeeId: number): Promise<AttendanceRecord[]> => {
    const response = await axiosInstance.get<{ records: AttendanceRecord[] }>(
      `/employees/${employeeId}/attendance-records-last-30`
    )
    return response.data.records
  },

  getAttendanceReport: async (startDate: Date, endDate: Date, departmentId?: number): Promise<Blob> => {
    const response = await axiosInstance.get<Blob>('/employees/attendance-report', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        departmentId,
      },
      responseType: 'blob' as const,
    })
    return response.data
  },

  updateAttendanceRecord: async (
    id: number,
    data: Partial<Pick<AttendanceRecord, 'checkIn' | 'checkOut' | 'autoClosed'>>
  ): Promise<AttendanceRecord> => {
    const res = await axiosInstance.put(`/employees/attendance-records/${id}`, data)
    return res.data.record
  },

  deleteAttendanceRecord: async (id: number) => {
    await axiosInstance.delete(`/attendance/${id}`)
  },

  async getAbsences(employeeId: number, startDate?: Date, endDate?: Date): Promise<AbsenceRecord[]> {
    const params: Record<string, string> = {}
    if (startDate) params.startDate = startDate.toISOString()
    if (endDate) params.endDate = endDate.toISOString()
    const res = await axiosInstance.get<{ absences: AbsenceRecord[] }>(`/employees/${employeeId}/absences`, { params })
    return res.data.absences
  },

  async createAbsence(payload: CreateAbsenceRecord): Promise<AbsenceRecord> {
    const params = {
      employeeId: payload.employeeId,
      absenceTypeId: payload.absenceTypeId,
      startDate: payload.startDate.toISOString(),
      endDate: payload.endDate.toISOString(),
    }
    const res = await axiosInstance.post<{ absenceRecord: AbsenceRecord }>(`/employees/${params.employeeId}/absences`, {
      params,
    })
    return res.data.absenceRecord
  },

  async updateAbsence(
    id: number,
    data: Partial<Pick<AbsenceRecord, 'startDate' | 'endDate' | 'absenceTypeId'>> & { absenceTypeId?: number }
  ): Promise<AbsenceRecord> {
    const res = await axiosInstance.put<{ absenceRecord: AbsenceRecord }>(`/employees/absences/${id}`, data)
    return res.data.absenceRecord
  },

  async deleteAbsence(id: number): Promise<void> {
    await axiosInstance.delete(`/employees/absences/${id}`)
  },
}
