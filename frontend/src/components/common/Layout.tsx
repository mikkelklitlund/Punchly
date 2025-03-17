import { ReactNode } from 'react'
import Header from './Header'
import { useAuth } from '../../contexts/AuthContext'
import { Role } from 'shared'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { user, role } = useAuth()
  const showSidebar = (user && role === Role.ADMIN) || role === Role.MANAGER

  return (
    <div className="flex">
      {showSidebar && <Sidebar />}
      <div className="w-full">
        {user && <Header />}
        {children}
      </div>
    </div>
  )
}

export default Layout
