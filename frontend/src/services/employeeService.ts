import {
  SimpleEmployeeDTO,
  CreateEmployeeDTO,
  EmployeeDTO,
  AttendanceRecordDTO,
  AbsenceRecordDTO,
  CreateAbsenceRecordDTO,
  CalendarDate,
  CreateAttendanceRecordDTO,
} from 'shared'
import axiosInstance from '../api/axios'
import dayjs from 'dayjs'

export interface EmployeeResponse {
  employees: SimpleEmployeeDTO[]
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

  async createEmployee(payload: Omit<CreateEmployeeDTO, 'profilePicturePath'>): Promise<EmployeeDTO> {
    const res = await axiosInstance.post<{ employee: EmployeeDTO }>('/employees', payload)
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

  async getEmployeeById(id: number): Promise<EmployeeDTO> {
    const res = await axiosInstance.get<{ employee: EmployeeDTO }>(`/employees/${id}`)
    return res.data.employee
  },

  async updateEmployee(id: number, data: Partial<EmployeeDTO>): Promise<EmployeeDTO> {
    const res = await axiosInstance.put<{ employee: EmployeeDTO }>(`/employees/${id}`, data)
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

  async getAttendanceRecords(employeeId: number, startDate: string, endDate: string): Promise<AttendanceRecordDTO[]> {
    const params: Record<string, string> = {
      startDate: dayjs(startDate).toISOString(),
      endDate: dayjs(endDate).toISOString(),
    }
    const res = await axiosInstance.get<{ records: AttendanceRecordDTO[] }>(`/employees/${employeeId}/attendances`, {
      params,
    })
    return res.data.records
  },

  getAttendanceReport: async (startDate: CalendarDate, endDate: CalendarDate, departmentId?: number): Promise<Blob> => {
    const response = await axiosInstance.get<Blob>('/employees/attendance-report', {
      params: {
        startDate: startDate,
        endDate: endDate,
        departmentId,
      },
      responseType: 'blob' as const,
    })
    return response.data
  },

  createAttendance: async (data: CreateAttendanceRecordDTO): Promise<AttendanceRecordDTO> => {
    if (data.checkIn) {
      data.checkIn = dayjs(data.checkIn).toISOString()
    }
    if (data.checkOut) {
      data.checkOut = dayjs(data.checkOut).toISOString()
    }
    const res = await axiosInstance.post(`/employees/attendance-records/${data.employeeId}`, data)
    return res.data.record
  },

  updateAttendanceRecord: async (
    id: number,
    data: Partial<Pick<AttendanceRecordDTO, 'checkIn' | 'checkOut' | 'autoClosed'>>
  ): Promise<AttendanceRecordDTO> => {
    if (data.checkIn) {
      data.checkIn = dayjs(data.checkIn).toISOString()
    }
    if (data.checkOut) {
      data.checkOut = dayjs(data.checkOut).toISOString()
    }
    const res = await axiosInstance.put(`/employees/attendance-records/${id}`, data)
    return res.data.record
  },

  deleteAttendanceRecord: async (id: number) => {
    await axiosInstance.delete(`/attendance/${id}`)
  },

  async getAbsences(employeeId: number, startDate: string, endDate: string): Promise<AbsenceRecordDTO[]> {
    const params: Record<string, string> = {
      startDate,
      endDate,
    }
    const res = await axiosInstance.get<{ absences: AbsenceRecordDTO[] }>(`/employees/${employeeId}/absences`, {
      params,
    })
    return res.data.absences
  },

  async createAbsence(payload: CreateAbsenceRecordDTO): Promise<AbsenceRecordDTO> {
    const params = {
      employeeId: payload.employeeId,
      absenceTypeId: payload.absenceTypeId,
      startDate: payload.startDate,
      endDate: payload.endDate,
    }
    const res = await axiosInstance.post<{ absenceRecord: AbsenceRecordDTO }>(
      `/employees/${params.employeeId}/absences`,
      {
        params,
      }
    )
    return res.data.absenceRecord
  },

  async updateAbsence(
    id: number,
    data: Partial<Pick<AbsenceRecordDTO, 'startDate' | 'endDate' | 'absenceTypeId'>> & { absenceTypeId?: number }
  ): Promise<AbsenceRecordDTO> {
    const res = await axiosInstance.put<{ absenceRecord: AbsenceRecordDTO }>(`/employees/absences/${id}`, data)
    return res.data.absenceRecord
  },

  async deleteAbsence(id: number): Promise<void> {
    await axiosInstance.delete(`/employees/absences/${id}`)
  },
}
