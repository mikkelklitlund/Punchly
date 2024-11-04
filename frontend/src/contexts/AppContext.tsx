import { createContext, ReactNode, useContext, useState } from 'react'
import { Department } from 'shared'
import axios from '../api/axios'

interface IAppContext {
  departments: Department[]
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>
  currentDepartment?: Department
  setCurrentDepartment: React.Dispatch<React.SetStateAction<Department | undefined>>
  fetchDepartments: (companyId: number) => Promise<void>
}

const AppContext = createContext<IAppContext | undefined>(undefined)

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
      const response = await axios.get(`/companies/${companyId}/departments`)
      setDepartments(response.data.departments)
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
