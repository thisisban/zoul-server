const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Создаем системные роли
  const roles = [
    {
      id: 1,
      order: 300,
      name: 'blacklist',
      displayName: 'Blacklist',
      isSystemRole: true,
      permissions: [],
      bans: ['*'],
    },
    {
      id: 2,
      order: 255,
      name: 'admin',
      displayName: 'Admin',
      isSystemRole: true,
      permissions: ['*'],
      bans: [],
    },
    {
      id: 3,
      order: 1,
      name: 'authenticated',
      displayName: 'Authenticated',
      isSystemRole: true,
      permissions: [
        'audio.upload',
        'audio.own.manage',
        'profile.edit',
        'audio.vote',
        'audio.favorite',
      ],
      bans: [],
    },
    {
      id: 4,
      order: 0,
      name: 'guest',
      displayName: 'Guest',
      isSystemRole: true,
      permissions: [
        'site.view',
        'audio.public.view',
        'user.public.view',
      ],
      bans: [],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: role,
      create: role,
    });
  }

  // Создаем администратора по умолчанию
  const adminEmail = 'admin@zoul.local';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        passwordHash,
        displayName: 'Administrator',
        statistics: {
          create: {},
        },
      },
    });

    // Назначаем роль администратора
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: 2, // Admin role
      },
    });

    console.log('Admin user created: admin@zoul.local / admin123');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });