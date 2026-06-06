import 'dotenv/config';
import { getPrisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const prisma = getPrisma();

async function main() {
  console.log('Seeding Reviewer Account...');
  
  const passwordHash = await bcrypt.hash('reviewer123!', 12);
  
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@buildbot.local' },
    update: {},
    create: {
      email: 'reviewer@buildbot.local',
      name: 'Reviewer',
      passwordHash,
    },
  });

  console.log('Clearing old apps for reviewer...');
  await prisma.project.deleteMany({ where: { userId: reviewer.id } });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
