import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AppError } from '../lib/appError';
import catchAsync from '../lib/catchAsync';
import * as auth from '../services/auth.service';

const email = z.string().trim().email().toLowerCase();
const password = z.string().min(8).max(72);
const registration = z.object({ name: z.string().trim().min(1).max(50), email, password }).strict();
const credentials = z.object({ email, password: z.string().min(1).max(72) }).strict();

export const register = catchAsync(async (req, res) => {
  const input = registration.parse(req.body);
  const session = await auth.signup(input.name, input.email, input.password);
  res.status(201).json({ status: 'success', token: session.token, data: { user: session.user } });
});
export const login = catchAsync(async (req, res) => {
  const input = credentials.parse(req.body);
  const session = await auth.login(input.email, input.password);
  res.json({ status: 'success', token: session.token, data: { user: session.user } });
});
export const resetPassword = catchAsync(async (req, res) => {
  const input = z.object({ token: z.string().min(1), newPassword: password }).strict().parse(req.body);
  const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');
  const hashedPassword = await bcrypt.hash(input.newPassword, 12);
  const result = await prisma.user.updateMany({
    where: { resetPasswordToken: hashedToken, resetPasswordExpires: { gt: new Date() }, active: true },
    data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null, passwordChangedAt: new Date() },
  });
  if (result.count !== 1) throw new AppError('Token is invalid or has expired.', 400);
  res.json({ status: 'success', message: 'Password reset successfully.' });
});
export const updatePassword = catchAsync(async (req, res) => {
  const input = z.object({ currentPassword: z.string().min(1), newPassword: password }).strict().parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: res.locals.user.id } });
  if (!user || !(await bcrypt.compare(input.currentPassword, user.password))) throw new AppError('Current password is incorrect.', 401);
  await prisma.user.update({ where: { id: user.id }, data: {
    password: await bcrypt.hash(input.newPassword, 12), passwordChangedAt: new Date(),
  } });
  res.json({ status: 'success', message: 'Password updated. Sign in again.' });
});
export const me = catchAsync(async (_req, res) => {
  const user = await prisma.user.findUnique({ where: { id: res.locals.user.id }, select: auth.publicUserSelect });
  res.json({ status: 'success', data: { user } });
});
