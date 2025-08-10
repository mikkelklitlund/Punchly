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
  const showSidebar = user && role && (role === Role.ADMIN || role === Role.MANAGER)
  const showHeader = user && role && role === Role.COMPANY

  if (!user || !role) {
    return <main className="h-dvh w-full">{children}</main>
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {showSidebar && (
        <div className="flex-shrink-0 overflow-y-auto border-r bg-white">
          <Sidebar />
        </div>
      )}
      <div className="flex w-full flex-col">
        {showHeader && <Header />}
        <main className="overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
}

export default Layout
