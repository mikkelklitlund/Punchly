import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

class UserRepository {
    async createUser(email: string, password: string, username: string): Promise<User> {
        return await prisma.user.create({
            data: { email, password, username },
        });
    }

    async getUserById(id: number): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { id },
        });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    async getUserByUsername(username: string): Promise<User | null> {
        return await prisma.user.findFirst({
            where: { username },
        });
    }

    async searchUsersByUsernameOrEmail(query: string): Promise<User[]> {
        return await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
                deletedAt: null,
            },
        });
    }

    async getAllActiveUsers(): Promise<User[]> {
        return await prisma.user.findMany({
            where: { deletedAt: null },
        });
    }

    async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data,
        });
    }

    async softDeleteUser(id: number): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

export default new UserRepository();