import { RequestHandler } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../lib/appError';
import { verifyToken } from '../lib/jwt';

export const protect: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { next(new AppError('Sign in required.', 401)); return; }
  let payload;
  try { payload = verifyToken(header.slice(7)); }
  catch { next(new AppError('Invalid or expired token.', 401)); return; }
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.active || payload.passwordVersion !== (user.passwordChangedAt?.getTime() ?? 0)) {
      next(new AppError('Sign in again.', 401)); return;
    }
    res.locals.user = { id: user.id, role: user.role };
    next();
  } catch (error) { next(error); }
};
