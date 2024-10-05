import EmployeeRepository from '../repositories/EmployeeRepository';
import { Employee } from '@prisma/client';
import { Result, failure, success } from '../utils/Result';
import CompanyRepository from '../repositories/CompanyRepository';
import DepartmentRepository from '../repositories/DepartmentRepository';
import EmployeeTypeRepository from '../repositories/EmployeeTypeRepository';
import { DatabaseError, ValidationError } from '../utils/Errors';

class EmployeeService {
    async createEmployee(data: Omit<Employee, 'id'>): Promise<Result<Employee, ValidationError | DatabaseError>> {
        if (!data.name || data.name.trim().length === 0) {
            return failure(new ValidationError('Name is required', 'name'));

        }

        const companyExists = await CompanyRepository.getCompanyById(data.companyId);
        if (!companyExists) {
            return failure(new ValidationError('Invalid company ID', 'companyId'));
        }

        const departmentExists = await DepartmentRepository.getDepartmentById(data.departmentId);
        if (!departmentExists) {
            return failure(new ValidationError('Invalid department ID', 'departmentId'));
        }

        const employeeTypeExists = await EmployeeTypeRepository.getEmployeeTypeById(data.employeeTypeId);
        if (!employeeTypeExists) {
            return failure(new ValidationError('Invalid employee type', 'employeeTypeId'));
        }

        if (data.monthlySalary && data.hourlySalary) {
            return failure(new ValidationError('Both monthly and hourly salary are filled', 'salary'));
        }

        if (data.monthlySalary && data.monthlySalary < 0) {
            return failure(new ValidationError('Monthly salary must be positive', 'monthlySalary'));
        }

        if (data.hourlySalary && data.hourlySalary < 0) {
            return failure(new ValidationError('Hourly salary must be positive', 'hourlySalary'));
        }

        const currentDate = new Date();
        const age = currentDate.getFullYear() - data.birthday.getFullYear();
        if (age < 13) {
            return failure(new ValidationError('Must be over the age of 13 to be employed', 'birthday'));
        }

        try {
            const employee = await EmployeeRepository.createEmployee(data);
            return success(employee);
        } catch (error) {
            console.error('Error creating employee:', error);
            return failure(new DatabaseError('Database error occurred while creating the employee'));
        }
    }

    async getEmployeeById(id: number): Promise<Result<Employee, string>> {
        try {
            const employee = await EmployeeRepository.getEmployeeById(id);
            if (!employee) {
                return failure(`Employee with ID ${id} not found`);
            }
            return success(employee);
        } catch (error) {
            console.error('Error fetching employee by ID:', error);
            return failure('Database error occurred while fetching the employee');
        }
    }

    async getAllEmployees(): Promise<Result<Employee[], string>> {
        try {
            const employees = await EmployeeRepository.getAllEmployees();
            return success(employees);
        } catch (error) {
            console.error('Error fetching all employees:', error);
            return failure('Database error occurred while fetching employees');
        }
    }

    async updateEmployee(id: number, data: Partial<Omit<Employee, 'id'>>): Promise<Result<Employee, ValidationError | DatabaseError>> {
        try {
            const existingEmployee = await EmployeeRepository.getEmployeeById(id);
            if (!existingEmployee) {
                return failure(new ValidationError(`Employee with ID ${id} not found`, 'id'));
            }

            if (data.name && data.name.trim().length === 0) {
                return failure(new ValidationError('Name cannot be empty', 'name'));
            }

            if (data.companyId) {
                const companyExists = await CompanyRepository.getCompanyById(data.companyId);
                if (!companyExists) {
                    return failure(new ValidationError('Invalid company ID', 'companyId'));
                }
            }

            if (data.departmentId) {
                const departmentExists = await DepartmentRepository.getDepartmentById(data.departmentId);
                if (!departmentExists) {
                    return failure(new ValidationError('Invalid department ID', 'departmentId'));
                }
            }

            if (data.employeeTypeId) {
                const employeeTypeExists = await EmployeeTypeRepository.getEmployeeTypeById(data.employeeTypeId);
                if (!employeeTypeExists) {
                    return failure(new ValidationError('Invalid employee type ID', 'employeeTypeId'));
                }
            }

            if (data.monthlySalary && data.hourlySalary) {
                return failure(new ValidationError('Both monthly and hourly salary cannot be filled at the same time', 'salary'));
            }

            if (data.monthlySalary && data.monthlySalary < 0) {
                return failure(new ValidationError('Monthly salary must be a positive number', 'monthlySalary'));
            }

            if (data.hourlySalary && data.hourlySalary < 0) {
                return failure(new ValidationError('Hourly salary must be a positive number', 'hourlySalary'));
            }

            if (data.birthday) {
                const currentDate = new Date();
                const age = currentDate.getFullYear() - data.birthday.getFullYear();
                if (age < 13) {
                    return failure(new ValidationError('Employee must be at least 13 years old', 'birthday'));
                }
            }

            const updatedEmployee = await EmployeeRepository.updateEmployee(id, data);
            return success(updatedEmployee);
        } catch (error) {
            console.error(`Error updating employee with ID ${id}:`, error);
            return failure(new DatabaseError('Database error occurred while updating the employee'));
        }
    }

    async deleteEmployee(id: number): Promise<Result<Employee, string>> {
        try {
            const employee = await EmployeeRepository.getEmployeeById(id);
            if (!employee) {
                return failure(`Employee with ID ${id} not found`);
            }

            const deletedEmployee = await EmployeeRepository.softDeleteEmployee(id);
            return success(deletedEmployee);
        } catch (error) {
            console.error(`Error deleting employee with ID ${id}:`, error);
            return failure('Database error occurred while deleting the employee');
        }
    }
}

export default new EmployeeService();
