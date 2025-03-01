import { ReactNode } from 'react'
import Header from './Header'
import { useAuth } from '../../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
      {user && <Header />}
      <main className={`flex-grow ${user ? 'pt-16' : ''}`}>{children}</main>
    </div>
  )
}

export default Layout
