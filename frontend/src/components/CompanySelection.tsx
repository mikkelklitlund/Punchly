import { useEffect, useState } from 'react'
import { Company } from 'shared'

interface CompanySelectionProps {
  onSelect: (company: Company) => void
}

function CompanySelection({ onSelect }: CompanySelectionProps) {
  const [companies, setCompanies] = useState<Company[] | []>([])
  useEffect(() => {
    //const companies = await fetchAllCompanies()
    //setCompanies(companies)
  })

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
