import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './dist/generated/prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const phone = process.env.ADMIN_PHONE || '+10000000000';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = 'Admin User';
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log('Admin already exists', existing.id);
    await prisma.$disconnect();
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, phone, passwordHash, role: 'ADMIN' }
  });
  console.log('Created admin', user.id);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
