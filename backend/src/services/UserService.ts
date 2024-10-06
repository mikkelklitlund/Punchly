import UserRepository from '../repositories/UserRepository';
import { User } from '@prisma/client';

class UserService {
    constructor(private readonly userRepository: UserRepository) { }
    async createUser(email: string, password: string, username: string) {
        return await this.userRepository.createUser(email, password, username);
    }

    async getUserById(id: number) {
        return await this.userRepository.getUserById(id);
    }

    async getAllUsers() {
        return await this.userRepository.getAllActiveUsers();
    }

    async updateUser(id: number, data: Partial<Omit<User, 'id'>>) {
        return await this.userRepository.updateUser(id, data);
    }

    async deleteUser(id: number) {
        return await this.userRepository.softDeleteUser(id);
    }
}

export default UserService;
