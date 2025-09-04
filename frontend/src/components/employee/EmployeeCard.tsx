import React from 'react'
import { SimpleEmployeeDTO } from 'shared'
import { getProfilePictureUrl } from '../../utils/imageUtils'

interface EmployeeCardProps {
  employee: SimpleEmployeeDTO
}

const EmployeeCard = React.memo(({ employee }: EmployeeCardProps) => {
  const absence = employee.absence
  const isAbsentToday = !!absence
  const reason = absence?.absenceType?.name ?? ''

  return (
    <div
      className={[
        'relative flex h-full w-full flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-md transition',
        isAbsentToday ? 'opacity-70 grayscale' : '',
      ].join(' ')}
    >
      {isAbsentToday && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rounded-md bg-black/60 px-3 py-1.5 text-sm font-semibold text-white shadow">{reason}</span>
        </div>
      )}

      <img
        src={getProfilePictureUrl(employee.profilePicturePath)}
        className="h-40 w-40 rounded-lg object-cover shadow-lg sm:h-48 sm:w-48 lg:h-52 lg:w-52"
        alt={`${employee.name}'s profile`}
        loading="lazy"
      />

      <div className="mt-4 flex items-center space-x-2">
        <p className="text-lg sm:text-xl">{employee.name}</p>

        {!isAbsentToday && (
          <div className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full sm:h-4 sm:w-4 ${employee.checkedIn ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        )}
      </div>
    </div>
  )
})

export default EmployeeCard
