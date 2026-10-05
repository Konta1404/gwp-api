import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { signToken } from '../lib/jwt';
import { AppError } from '../lib/appError';

export const publicUserSelect = {
  id: true, name: true, email: true, role: true, active: true,
} satisfies Prisma.UserSelect;

type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
function session(user: PublicUser, changedAt: Date | null = null) {
  return { user, token: signToken({ id: user.id, role: user.role, passwordVersion: changedAt?.getTime() ?? 0 }) };
}

export async function signup(name: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'Participant' },
      select: publicUserSelect,
    });
    return session(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('An account with this email already exists.', 409);
    }
    throw error;
  }
}
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password.', 401);
  }
  return session({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active }, user.passwordChangedAt);
}
