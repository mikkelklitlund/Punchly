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
  const showHeader = user && role == Role.COMPANY

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && (
        <div className="flex-shrink-0 overflow-y-auto border-r bg-white">
          <Sidebar />
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        {showHeader && <Header />}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
}

export default Layout
