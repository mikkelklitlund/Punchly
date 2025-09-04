export const qk = {
  companies: ['companies'] as const,
  departments: (companyId: number | undefined) => ['departments', { companyId }] as const,
  employeeTypes: (companyId: number | undefined) => ['employeeTypes', { companyId }] as const,
  employees: (companyId: number | undefined, departmentId?: number) =>
    ['employees', { companyId, departmentId }] as const,
  attendanceRecords: (employeeId: number | undefined) => ['attendanceRecords', employeeId] as const,
}
