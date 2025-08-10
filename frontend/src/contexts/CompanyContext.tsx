import { createContext, useContext, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Department, EmployeeType, SimpleEmployee } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'
import { employeeService } from '../services/employeeService'

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

  const {
    data: departmentData,
    isLoading: deptLoading,
    error: deptError,
  } = useQuery({
    queryKey: ['departments', companyId],
    queryFn: () => (companyId ? companyService.getDepartments(companyId) : Promise.reject('No company ID')),
    enabled: !!companyId,
  })

  const {
    data: employeeTypeData,
    isLoading: typeLoading,
    error: typeError,
  } = useQuery({
    queryKey: ['employeeTypes', companyId],
    queryFn: () => (companyId ? companyService.getEmployeeTypes(companyId) : Promise.reject('No company ID')),
    enabled: !!companyId,
  })

  const {
    data: employeeData,
    isLoading: empLoading,
    error: empError,
    refetch: refreshEmployees,
  } = useQuery({
    queryKey: ['employees', companyId, currentDepartment?.id],
    queryFn: () =>
      companyId ? employeeService.getEmployees(companyId, currentDepartment?.id) : Promise.reject('No company ID'),
    enabled: !!companyId,
    refetchInterval: 30000,
  })

  const filteredEmployees = useMemo(() => {
    if (!currentDepartment) return employeeData?.employees || []
    return employeeData?.employees.filter((e) => e.departmentId === currentDepartment.id) || []
  }, [employeeData, currentDepartment])

  return (
    <CompanyContext.Provider
      value={{
        departments: departmentData?.departments || [],
        currentDepartment,
        setCurrentDepartment,
        employees: filteredEmployees,
        employeeTypes: employeeTypeData?.employeeTypes || [],
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
  const context = useContext(CompanyContext)
  if (!context) throw new Error('useCompany must be used within a CompanyProvider')
  return context
}
