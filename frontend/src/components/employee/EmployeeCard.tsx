import React from 'react'
import { SimpleEmployee } from 'shared'

interface EmployeeCardProps {
  employee: SimpleEmployee
}

const EmployeeCard = React.memo(({ employee }: EmployeeCardProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-md">
      <img
        src={employee.profilePicturePath}
        className="h-40 w-40 rounded-lg object-cover shadow-lg sm:h-48 sm:w-48 lg:h-52 lg:w-52"
        alt={`${employee.name}'s profile`}
        loading="lazy"
      />

      <div className="mt-4 flex items-center space-x-2">
        <p className="text-lg sm:text-xl">{employee.name}</p>
        <div className="flex items-center">
          <div
            className={`h-3 w-3 rounded-full sm:h-4 sm:w-4 ${employee.checkedIn ? 'bg-green-500' : 'bg-red-500'} `}
          ></div>
          <span className={`ml-1 text-xs font-medium ${employee.checkedIn ? 'text-green-600' : 'text-red-600'}`}></span>
        </div>
      </div>
    </div>
  )
})

EmployeeCard.displayName = 'EmployeeCard'

export default EmployeeCard
