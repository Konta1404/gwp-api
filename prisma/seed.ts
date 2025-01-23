import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { defaultUsers } from './seed-data/users';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding users...');
    for (const user of defaultUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 12); // Hash the plain password
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                email: user.email,
                name: user.name,
                password: hashedPassword,
                role: user.role, // Use the enum value
            },
        });
    }

    console.log('Users have been seeded successfully.');
}

main()
    .catch((error) => {
        console.error('Error seeding database:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
