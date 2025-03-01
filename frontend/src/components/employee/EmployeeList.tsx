import { SimpleEmployee } from 'shared'
import EmployeeCard from './EmployeeCard'

interface EmployeeListProps {
  employees: SimpleEmployee[]
  onEmployeeClick: (employee: SimpleEmployee) => void
}

const EmployeeList = ({ employees, onEmployeeClick }: EmployeeListProps) => {
  return (
    <div className="flex flex-wrap gap-8 p-4 sm:gap-10 sm:p-6 lg:gap-12 lg:p-8 justify-center lg:justify-start">
      {employees.length > 0 ? (
        employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => onEmployeeClick(employee)}
            className="transition-transform transform hover:scale-105 rounded-lg focus:outline-none 
            focus:ring-2 focus:ring-blue-300"
          >
            <EmployeeCard employee={employee} />
          </button>
        ))
      ) : (
        <p className="text-center w-full">Ingen medarbejdere fundet</p>
      )}
    </div>
  )
}

export default EmployeeList
