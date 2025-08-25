import { createContext, useContext, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Department, EmployeeType, SimpleEmployee } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'
import { employeeService } from '../services/employeeService'

type ApiError = { status?: number; message?: string }

interface CompanyContextType {
  departments: Department[]
  currentDepartment: Department | undefined
  setCurrentDepartment: (dep: Department | undefined) => void
  employees: SimpleEmployee[]
  employeeTypes: EmployeeType[]
  isLoading: boolean
  error: string | null
  refreshEmployees: () => void
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { companyId } = useAuth()
  const [currentDepartment, setCurrentDepartment] = useState<Department | undefined>(undefined)
  const departmentId = currentDepartment?.id

  const {
    data: departments = [],
    isLoading: deptLoading,
    error: deptError,
  } = useQuery<{ departments: Department[] }, ApiError, Department[]>({
    queryKey: ['departments', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getDepartments(companyId!),
    select: (d) => d.departments,
    staleTime: 5 * 60 * 1000,
    retry: (failures, err) => (err.status && err.status >= 500 ? failures < 2 : false),
    refetchOnWindowFocus: false,
  })

  const {
    data: employeeTypes = [],
    isLoading: typeLoading,
    error: typeError,
  } = useQuery<{ employeeTypes: EmployeeType[] }, ApiError, EmployeeType[]>({
    queryKey: ['employeeTypes', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getEmployeeTypes(companyId!),
    select: (d) => d.employeeTypes,
    staleTime: 5 * 60 * 1000,
    retry: (failures, err) => (err.status && err.status >= 500 ? failures < 2 : false),
    refetchOnWindowFocus: false,
  })

  const {
    data: employees = [],
    isLoading: empLoading,
    error: empError,
    refetch: refreshEmployees,
  } = useQuery<{ employees: SimpleEmployee[]; total: number }, ApiError, SimpleEmployee[]>({
    queryKey: ['employees', { companyId, departmentId }],
    enabled: !!companyId,
    queryFn: () => employeeService.getEmployees(companyId!, departmentId),
    select: (d) => d.employees,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
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
