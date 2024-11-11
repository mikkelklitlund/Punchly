import { useEffect, useState } from 'react'
import { Company } from 'shared'
import axios from '../api/axios'

interface CompanySelectionProps {
  onSelect: (company: Company) => void
}

function CompanySelection({ onSelect }: CompanySelectionProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  useEffect(() => {
    let isMounted = true
    const constroller = new AbortController()

    const getCompanies = async () => {
      try {
        const response = await axios.get('/companies/all')
        if (isMounted) setCompanies(response.data)
      } catch (err) {
        console.log(err)
      }
    }
    getCompanies()
    return () => {
      isMounted = false
      constroller.abort()
    }
  }, [])

  return (
    <div>
      <h2>Select a Company</h2>
      <ul>
        {companies.map((company) => (
          <li key={company.id} onClick={() => onSelect(company)}>
            {company.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CompanySelection
