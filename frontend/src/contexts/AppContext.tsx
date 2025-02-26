import { createContext, ReactNode, useContext, useState } from 'react'
import { Department } from 'shared'
import { companyService } from '../services/companyService'

interface IAppContext {
  departments: Department[]
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>
  currentDepartment?: Department
  setCurrentDepartment: React.Dispatch<React.SetStateAction<Department | undefined>>
  fetchDepartments: (companyId: number) => Promise<void>
}

const AppContext = createContext<IAppContext>({
  departments: [],
  setDepartments: () => {},
  currentDepartment: undefined,
  setCurrentDepartment: () => {},
  fetchDepartments: async () => {},
})

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider')
  }
  return context
}

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [currentDepartment, setCurrentDepartment] = useState<Department | undefined>(undefined)

  const fetchDepartments = async (companyId: number) => {
    try {
      const data = await companyService.getDepartments(companyId)
      setDepartments(data.departments)
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  return (
    <AppContext.Provider
      value={{
        departments,
        setDepartments,
        currentDepartment,
        setCurrentDepartment,
        fetchDepartments,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
