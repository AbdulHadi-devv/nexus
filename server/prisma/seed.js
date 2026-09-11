const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✅ Created user:', user.email);

  const items = [
    {
      title: 'JavaScript Promises',
      content: 'A Promise is an object representing the eventual completion or failure of an asynchronous operation.',
      type: 'NOTE',
      userId: user.id,
    },
    {
      title: 'MDN Fetch API',
      content: 'Documentation for the Fetch API',
      type: 'BOOKMARK',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
      userId: user.id,
    },
    {
      title: 'Async/Await in JavaScript',
      content: 'Async/await is syntactic sugar for Promises, making asynchronous code look synchronous.',
      type: 'NOTE',
      userId: user.id,
    },
  ];

  for (const item of items) {
    await prisma.knowledgeItem.create({ data: item });
  }

  console.log('✅ Created 3 sample knowledge items');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });