import request from 'supertest';
import bcrypt from 'bcryptjs';
const user = { id: 1, email: 'user@example.com', name: 'User', role: 'Participant', active: true, password: 'hash' };
jest.mock('../src/config/prisma', () => ({ __esModule: true, default: { user: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() } } }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(async () => 'hash'), compare: jest.fn(async () => true) }));
import prisma from '../src/config/prisma';
import app from '../src/app';
import { signToken } from '../src/lib/jwt';
const create = prisma.user.create as jest.Mock;
const find = prisma.user.findUnique as jest.Mock;
beforeEach(() => {
  process.env.JWT_SECRET = 'local-test-secret-with-at-least-32-characters';
  create.mockImplementation(async ({ select }) => Object.fromEntries(Object.keys(select).map(key => [key, user[key as keyof typeof user]])));
  find.mockResolvedValue(user);
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
});
it('registers only a participant and returns no password hash', async () => {
  const response = await request(app).post('/api/auth/register').send({ name: 'User', email: 'user@example.com', password: 'password123' });
  expect(response.status).toBe(201);
  expect(create.mock.calls[0][0].data.role).toBe('Participant');
  expect(response.body.data.user.password).toBeUndefined();
  expect(response.body.token).toEqual(expect.any(String));
});
it('rejects a client-supplied privileged role', async () => {
  const response = await request(app).post('/api/auth/register').send({ name: 'User', email: 'user@example.com', password: 'password123', role: 'Admin' });
  expect(response.status).toBe(400); expect(create).not.toHaveBeenCalled();
});
it('returns the documented login body without sensitive user fields', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'password123' });
  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  expect(Object.keys(response.body.data.user).sort()).toEqual(['active', 'email', 'id', 'name', 'role']);
});
it('rejects bad passwords', async () => {
  (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  expect((await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'wrong' })).status).toBe(401);
});
it('rejects unauthenticated profile access', async () => {
  expect((await request(app).get('/api/auth/me')).status).toBe(401);
});
it('invalidates a token issued before a password change', async () => {
  const token = signToken({ id: 1, role: 'Participant' });
  find.mockResolvedValue({ ...user, passwordChangedAt: new Date(Date.now() + 1000) });
  expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
});
it('rejects inactive users even with a valid token', async () => {
  const token = signToken({ id: 1, role: 'Participant' });
  find.mockResolvedValue({ ...user, active: false });
  expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
});

it('accepts a fresh token immediately after a password change', async () => {
  const changedAt = new Date();
  const token = signToken({ id: 1, role: 'Participant', passwordVersion: changedAt.getTime() });
  find.mockResolvedValue({ ...user, passwordChangedAt: changedAt });
  expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);
});
