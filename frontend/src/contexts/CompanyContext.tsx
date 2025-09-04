import { createContext, useContext, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'
import { employeeService } from '../services/employeeService'
import { ApiError } from '../utils/errorUtils'
import { DepartmentDTO, SimpleEmployeeDTO, EmployeeTypeDTO } from 'shared'

interface CompanyContextType {
  departments: DepartmentDTO[]
  currentDepartment: DepartmentDTO | undefined
  setCurrentDepartment: (dep: DepartmentDTO | undefined) => void
  employees: SimpleEmployeeDTO[]
  employeeTypes: EmployeeTypeDTO[]
  isLoading: boolean
  error: string | null
  refreshEmployees: () => void
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { companyId } = useAuth()
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentDTO | undefined>(undefined)
  const departmentId = currentDepartment?.id

  const {
    data: departments = [],
    isLoading: deptLoading,
    error: deptError,
  } = useQuery<{ departments: DepartmentDTO[] }, ApiError, DepartmentDTO[]>({
    queryKey: ['departments', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getDepartments(companyId!),
    select: (d) => d.departments,
    staleTime: Infinity,
    retry: (failures, err) => (err.status && err.status >= 500 ? failures < 2 : false),
    refetchOnWindowFocus: false,
  })

  const {
    data: employeeTypes = [],
    isLoading: typeLoading,
    error: typeError,
  } = useQuery<{ employeeTypes: EmployeeTypeDTO[] }, ApiError, EmployeeTypeDTO[]>({
    queryKey: ['employeeTypes', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getEmployeeTypes(companyId!),
    select: (d) => d.employeeTypes,
    staleTime: Infinity,
    retry: (failures, err) => (err.status && err.status >= 500 ? failures < 2 : false),
    refetchOnWindowFocus: false,
  })

  const poll = () => (document.visibilityState === 'visible' ? 30_000 : false)

  const {
    data: employees = [],
    isLoading: empLoading,
    error: empError,
    refetch: refreshEmployees,
  } = useQuery<{ employees: SimpleEmployeeDTO[]; total: number }, ApiError, SimpleEmployeeDTO[]>({
    queryKey: ['employees', { companyId, departmentId }],
    enabled: !!companyId,
    queryFn: () => employeeService.getEmployees(companyId!, departmentId),
    select: (d) => d.employees,
    placeholderData: keepPreviousData,
    refetchInterval: poll,
    refetchIntervalInBackground: false,
    retry: (failures, err) => (err.status && err.status >= 500 ? failures < 2 : false),
  })

  return (
    <CompanyContext.Provider
      value={{
        departments,
        currentDepartment,
        setCurrentDepartment,
        employees,
        employeeTypes,
        isLoading: deptLoading || empLoading || typeLoading,
        error: deptError?.message || empError?.message || typeError?.message || null,
        refreshEmployees,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within a CompanyProvider')
  return ctx
}
