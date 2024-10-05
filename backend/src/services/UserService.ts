import UserRepository from '../repositories/UserRepository';
import { User } from '@prisma/client';

class UserService {
    async createUser(email: string, password: string, username: string) {
        return await UserRepository.createUser(email, password, username);
    }

    async getUserById(id: number) {
        return await UserRepository.getUserById(id);
    }

    async getAllUsers() {
        return await UserRepository.getAllActiveUsers();
    }

    async updateUser(id: number, data: Partial<Omit<User, 'id'>>) {
        return await UserRepository.updateUser(id, data);
    }

    async deleteUser(id: number) {
        return await UserRepository.softDeleteUser(id);
    }
}

export default new UserService();
