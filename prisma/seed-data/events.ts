import { Role } from '@prisma/client';

// Seed data for users
export const defaultUsers = [
    {
        email: 'super.admin@example.com',
        name: 'Admin User',
        password: 'admin123', // Admin password
        role: Role.SuperAdmin,
    },
    {
        email: 'veselin.kontic@gmail.com',
        name: 'Veselin',
        password: 'admin123', // Admin password
        role: Role.SuperAdmin,
    },
    {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123', // Regular user password
        role: Role.Admin
    },
];