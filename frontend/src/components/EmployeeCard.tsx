import { SimpleEmployee } from 'shared'

interface EmployeeCardProps {
  employee: SimpleEmployee
}

function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <div className="flex flex-col items-center p-4 w-full sm:w-72 bg-white border border-gray-200 rounded-lg shadow-md">
      <img
        src={employee.profilePicturePath}
        className="rounded-lg shadow-lg object-cover h-48 w-48 sm:h-60 sm:w-60"
        alt={`${employee.name}'s profile`}
      />
      <p className="text-xl sm:text-2xl mt-4">{employee.name}</p>
    </div>
  )
}

export default EmployeeCard
