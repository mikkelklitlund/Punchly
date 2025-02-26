import { ReactNode } from 'react'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">{children}</main>
    </div>
  )
}

export default Layout
