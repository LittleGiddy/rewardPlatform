import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'vuna-admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aOi7fqELjoV15CCW';

async function main() {
  const admin = await prisma.admin.upsert({
    where: { username: ADMIN_USERNAME },
    update: { passwordHash: hashPassword(ADMIN_PASSWORD) },
    create: { username: ADMIN_USERNAME, passwordHash: hashPassword(ADMIN_PASSWORD) },
  });
  console.log(`[seed] admin ready: ${admin.username}`);

  await prisma.settings.upsert({
    where: { key: 'platformSettings' },
    update: { value: { claimsPerWinner: 500 } },
    create: { key: 'platformSettings', value: { claimsPerWinner: 500 } },
  });
  console.log('[seed] settings ready: claimsPerWinner=500');

  await prisma.counter.upsert({
    where: { name: 'claimCounter' },
    update: {},
    create: { name: 'claimCounter', value: 0 },
  });
  console.log('[seed] counter ready: claimCounter=0');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('[seed] failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
