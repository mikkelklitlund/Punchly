import { useState } from 'react'
import { Company } from 'shared'
import { useNavigate } from 'react-router-dom'
import CompanySelection from 'src/components/CompanySelection'
import { useAuth } from '../hooks/useAuth'

function Home() {
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    navigate('/login')
  }

  return (
    <div>
      <h1>Welcome! Please select a company</h1>
      <CompanySelection onSelect={handleCompanySelect} />
    </div>
  )
}

export default Home
