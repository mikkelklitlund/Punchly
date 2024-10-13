import { EmployeeType } from "shared";
import EmployeeTypeRepository from "src/repositories/EmployeeTypeRepository";
import { DatabaseError, ValidationError } from "src/utils/Errors";
import { failure, Result, success } from "src/utils/Result";

class EmployeeTypeService {
    constructor(private readonly employeeTypeRepository: EmployeeTypeRepository) { }

    async createEmployeeType(typeName: string, companyId: number): Promise<Result<EmployeeType, Error>> {
        if (!typeName || typeName.trim().length === 0) {
            return failure(new ValidationError('Type name is required.'));
        }

        if (await this.employeeTypeRepository.employeeTypeExistsOnCompanyId(companyId, typeName)) {
            return failure(new ValidationError('Type already exists.'));
        }

        try {
            const employeeType = await this.employeeTypeRepository.createEmployeeType(typeName, companyId);
            return success(employeeType);
        } catch (error) {
            console.error('Error creating employee type:', error);
            return failure(new DatabaseError('Database error occurred while creating the employee type.'));
        }
    }

    async getEmployeeTypesByCompanyId(companyId: number): Promise<Result<EmployeeType[], Error>> {
        const types = await this.employeeTypeRepository.getEmployeeTypeByCompanyId(companyId);
        return success(types)
    }
}

export default EmployeeTypeService