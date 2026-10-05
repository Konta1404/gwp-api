import jwt, { JwtPayload } from 'jsonwebtoken';

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
  return value;
}
export function signToken(payload: { id: number; role: string; passwordVersion?: number }): string {
  return jwt.sign({ ...payload, passwordVersion: payload.passwordVersion ?? 0 }, secret(), { algorithm: 'HS256', expiresIn: 86400 });
}
export function verifyToken(token: string): JwtPayload & { id: number; role: string } {
  const payload = jwt.verify(token, secret(), { algorithms: ['HS256'] });
  if (typeof payload === 'string' || !Number.isInteger(payload.id) || typeof payload.role !== 'string') {
    throw new Error('Invalid token payload');
  }
  return payload as JwtPayload & { id: number; role: string };
}
