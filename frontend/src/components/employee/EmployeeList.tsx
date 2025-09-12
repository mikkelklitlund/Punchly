import { SimpleEmployeeDTO } from 'shared'
import EmployeeCard from './EmployeeCard'

interface EmployeeListProps {
  employees: SimpleEmployeeDTO[]
  onEmployeeClick: (employee: SimpleEmployeeDTO) => void
}

const EmployeeList = ({ employees, onEmployeeClick }: EmployeeListProps) => {
  return (
    <div className="grid w-full grid-cols-1 gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {employees.length > 0 ? (
        employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => onEmployeeClick(employee)}
            className="w-full max-w-sm transform rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-blue-300 focus:outline-hidden"
          >
            <EmployeeCard employee={employee} />
          </button>
        ))
      ) : (
        <p className="col-span-full text-center">Ingen medarbejdere fundet</p>
      )}
    </div>
  )
}

export default EmployeeList
