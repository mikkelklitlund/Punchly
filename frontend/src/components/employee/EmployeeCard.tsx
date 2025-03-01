import React from 'react'
import { SimpleEmployee } from 'shared'

interface EmployeeCardProps {
  employee: SimpleEmployee
}

const EmployeeCard = React.memo(({ employee }: EmployeeCardProps) => {
  return (
    <div className="flex flex-col items-center p-4 w-full sm:w-72 bg-white border border-gray-200 rounded-lg shadow-md">
      <img
        src={employee.profilePicturePath}
        className="rounded-lg shadow-lg object-cover h-48 w-48 sm:h-60 sm:w-60"
        alt={`${employee.name}'s profile`}
        loading="lazy"
      />

      <div className="flex items-center mt-4 space-x-2">
        <p className="text-xl sm:text-2xl">{employee.name}</p>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full ${employee.checkedIn ? 'bg-green-500' : 'bg-red-500'} `}></div>
          <span className={`ml-1 text-xs font-medium ${employee.checkedIn ? 'text-green-600' : 'text-red-600'}`}></span>
        </div>
      </div>
    </div>
  )
})

EmployeeCard.displayName = 'EmployeeCard'

export default EmployeeCard
