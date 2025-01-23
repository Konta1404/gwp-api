import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '../lib/jwt';

export const signup = async (name: string, email: string, password: string) => {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    const token = signToken({ id: user.id, email: user.email });

    return { user, token };
};

export const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid email or password');
    }

    const token = signToken({ id: user.id, email: user.email });

    return { user, token };
};