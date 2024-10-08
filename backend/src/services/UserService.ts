import UserRepository from '../repositories/UserRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    async register(email: string, password: string, username: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.userRepository.createUser(email, hashedPassword, username);
    }

    async login(username: string, password: string): Promise<string> {
        const user = await this.userRepository.getUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Invalid credentials');
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT secret is not defined');
        }

        return jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
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
