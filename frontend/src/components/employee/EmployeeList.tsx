import { SimpleEmployee } from 'shared'
import EmployeeCard from './EmployeeCard'

interface EmployeeListProps {
  employees: SimpleEmployee[]
  onEmployeeClick: (employee: SimpleEmployee) => void
}

const EmployeeList = ({ employees, onEmployeeClick }: EmployeeListProps) => {
  return (
    <div className="grid w-full auto-rows-fr grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 p-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] sm:p-6 lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] lg:p-8 xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
      {employees.length > 0 ? (
        employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => onEmployeeClick(employee)}
            className="flex transform justify-center rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
