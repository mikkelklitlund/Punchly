import AttendanceRecordRepository from '../repositories/AttendanceRecordRepository';
import { Result, success, failure } from '../utils/Result';
import { ValidationError, DatabaseError } from '../utils/Errors';
import { CreateAttendanceRecord, AttendanceRecord } from 'shared';
import EmployeeRepository from 'src/repositories/EmployeeRepository';

class AttendanceRecordService {
    constructor(private readonly attendanceRecordRepository: AttendanceRecordRepository, private readonly employeeRepository: EmployeeRepository) {
    }

    async createAttendanceRecord(newAttendance: CreateAttendanceRecord): Promise<Result<AttendanceRecord, Error>> {
        if (!newAttendance.employeeId) {
            return failure(new ValidationError('Employee ID is required.'));
        }

        if (!newAttendance.checkIn || !(newAttendance.checkIn instanceof Date)) {
            return failure(new ValidationError('A valid check-in time is required.'));
        }

        try {
            const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord(newAttendance);
            await this.employeeRepository.updateEmployee(newAttendance.employeeId, { checkedIn: true });
            return success(attendanceRecord);
        } catch (error) {
            console.error('Error creating attendance record:', error);
            return failure(new DatabaseError('Database error occurred while creating the attendance record.'));
        }
    }

    async checkInEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
        try {
            const checkIn = new Date();

            const attendanceRecord = await this.attendanceRecordRepository.createAttendanceRecord({ employeeId, checkIn });
            await this.employeeRepository.updateEmployee(employeeId, { checkedIn: false });
            return success(attendanceRecord);
        } catch (error) {
            console.error('Error during employee check-in:', error);
            return failure(new DatabaseError('Database error occurred during check-in.'));
        }
    }

    async checkOutEmployee(employeeId: number): Promise<Result<AttendanceRecord, Error>> {
        try {
            const attendanceRecord = await this.attendanceRecordRepository.getOngoingAttendanceRecord(employeeId);

            if (!attendanceRecord) {
                return failure(new ValidationError('No ongoing attendance record found for this employee.'));
            }

            const updatedRecord = await this.attendanceRecordRepository.updateAttendanceRecord(attendanceRecord.id, {
                checkOut: new Date(),
            });

            return success(updatedRecord);
        } catch (error) {
            console.error('Error during employee check-out:', error);
            return failure(new DatabaseError('Database error occurred during check-out.'));
        }
    }

    async getAttendanceRecordById(id: number): Promise<Result<AttendanceRecord, Error>> {
        if (!id) {
            return failure(new ValidationError('Attendance record ID is required.'));
        }

        try {
            const attendanceRecord = await this.attendanceRecordRepository.getAttendanceRecordById(id);
            if (!attendanceRecord) {
                return failure(new ValidationError(`Attendance record with ID ${id} not found.`));
            }
            return success(attendanceRecord);
        } catch (error) {
            console.error('Error fetching attendance record by ID:', error);
            return failure(new DatabaseError('Database error occurred while fetching the attendance record.'));
        }
    }

    async getAttendanceRecordsByEmployeeIdAndPeriod(employeeId: number, periodStart: Date, periodEnd: Date): Promise<Result<AttendanceRecord[], Error>> {
        if (!employeeId) {
            return failure(new ValidationError('Employee ID is required.'));
        }

        if (!periodStart || !(periodStart instanceof Date) || !periodEnd || !(periodEnd instanceof Date)) {
            return failure(new ValidationError('A valid date range is required.'));
        }

        try {
            const attendanceRecords = await this.attendanceRecordRepository.getAttendanceRecordsByEmployeeIdAndPeriod(employeeId, periodStart, periodEnd);
            return success(attendanceRecords);
        } catch (error) {
            console.error('Error fetching attendance records for employee by month:', error);
            return failure(new DatabaseError('Database error occurred while fetching attendance records.'));
        }
    }

    async updateAttendanceRecord(id: number, data: Partial<Omit<AttendanceRecord, 'id'>>): Promise<Result<AttendanceRecord, Error>> {
        if (!id) {
            return failure(new ValidationError('Attendance record ID is required.'));
        }

        if (!data) {
            return failure(new ValidationError('Update data is required.'));
        }

        try {
            const updatedAttendanceRecord = await this.attendanceRecordRepository.updateAttendanceRecord(id, data);
            return success(updatedAttendanceRecord);
        } catch (error) {
            console.error('Error updating attendance record:', error);
            return failure(new DatabaseError('Database error occurred while updating the attendance record.'));
        }
    }

    async deleteAttendanceRecord(id: number): Promise<Result<AttendanceRecord, Error>> {
        if (!id) {
            return failure(new ValidationError('Attendance record ID is required.'));
        }

        try {
            const deletedAttendanceRecord = await this.attendanceRecordRepository.deleteAttendanceRecord(id);
            return success(deletedAttendanceRecord);
        } catch (error) {
            console.error('Error deleting attendance record:', error);
            return failure(new DatabaseError('Database error occurred while deleting the attendance record.'));
        }
    }

}

export default AttendanceRecordService;
