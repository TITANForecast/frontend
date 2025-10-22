/**
 * Prisma database seeding script (JavaScript version)
 * Run with: node prisma/seed.js
 */

const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create dealers
  console.log('📍 Creating dealers...');
  
  const titanMotors = await prisma.dealer.upsert({
    where: { id: 'dealer-titan-001' },
    update: {},
    create: {
      id: 'dealer-titan-001',
      name: 'Titan Motors',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      contactEmail: 'contact@titanmotors.com',
      contactPhone: '555-0123',
      isActive: true,
    },
  });

  const autoPro = await prisma.dealer.upsert({
    where: { id: 'dealer-autopro-002' },
    update: {},
    create: {
      id: 'dealer-autopro-002',
      name: 'AutoPro Dealership',
      address: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      contactEmail: 'info@autopro.com',
      contactPhone: '555-0456',
      isActive: true,
    },
  });

  console.log(`✓ Created dealers: ${titanMotors.name}, ${autoPro.name}`);

  // Create API config for Titan Motors
  console.log('🔌 Creating API configurations...');
  
  await prisma.dealerApiConfig.upsert({
    where: { dealerId: titanMotors.id },
    update: {},
    create: {
      dealerId: titanMotors.id,
      dataSource: 'Certify-Staging',
      rooftopId: 'DVD00003',
      programId: 'DVV01606',
      fileTypeCodes: ['SV'],
      compareDateDefault: 1,
      lastSuccess: new Date('2024-10-07'),
      lastError: null,
      isActive: true,
    },
  });

  console.log('✓ Created API config for Titan Motors');

  // Create users (from Cognito)
  console.log('👤 Creating users from Cognito...');
  
  // Super Admin - Jay Long (you)
  const jayAdmin = await prisma.user.upsert({
    where: { email: 'jay@cyberworldbuilders.com' },
    update: {},
    create: {
      email: 'jay@cyberworldbuilders.com',
      cognitoSub: 'c4d8e4b8-0091-708f-36eb-20e33f84cc0e',
      name: 'Jay Long',
      role: 'SUPER_ADMIN',
      defaultDealerId: titanMotors.id,
      isActive: true,
    },
  });

  // Super Admin - Platform Admin
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@titanforecast.com' },
    update: {},
    create: {
      email: 'admin@titanforecast.com',
      cognitoSub: '849884c8-0011-705e-7770-da29b4b1eca3',
      name: 'Admin',
      role: 'SUPER_ADMIN',
      defaultDealerId: titanMotors.id,
      isActive: true,
    },
  });

  // Multi-Dealer User - Brandon Keach
  const multiDealerBrandon = await prisma.user.upsert({
    where: { email: 'brandon@titanforecast.com' },
    update: {},
    create: {
      email: 'brandon@titanforecast.com',
      cognitoSub: 'f45804e8-4081-7029-b36e-5eed106f8740',
      name: 'Brandon Keach',
      role: 'MULTI_DEALER',
      defaultDealerId: titanMotors.id,
      isActive: true,
    },
  });

  // Regular User - Ryan Wood (Titan Motors)
  const ryanUser = await prisma.user.upsert({
    where: { email: 'ryan@titanforecast.com' },
    update: {},
    create: {
      email: 'ryan@titanforecast.com',
      cognitoSub: '84781478-30e1-70ec-b8ee-bb57be06e0ae',
      name: 'Ryan Wood',
      role: 'USER',
      defaultDealerId: titanMotors.id,
      isActive: true,
    },
  });

  // Regular User - Lionel Robin (AutoPro)
  const lionelUser = await prisma.user.upsert({
    where: { email: 'lionel.robin528@gmail.com' },
    update: {},
    create: {
      email: 'lionel.robin528@gmail.com',
      cognitoSub: '147854b8-60d1-7015-5f87-0741ba003073',
      name: 'Lionel Robin',
      role: 'USER',
      defaultDealerId: autoPro.id,
      isActive: true,
    },
  });

  console.log(`✓ Created users: ${jayAdmin.name}, ${platformAdmin.name}, ${multiDealerBrandon.name}, ${ryanUser.name}, ${lionelUser.name}`);

  // Create user-dealer associations
  console.log('🔗 Creating user-dealer associations...');
  
  // Jay (Super Admin) has access to all dealers
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: jayAdmin.id,
        dealerId: titanMotors.id,
      },
    },
    update: {},
    create: {
      userId: jayAdmin.id,
      dealerId: titanMotors.id,
    },
  });

  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: jayAdmin.id,
        dealerId: autoPro.id,
      },
    },
    update: {},
    create: {
      userId: jayAdmin.id,
      dealerId: autoPro.id,
    },
  });

  // Platform Admin has access to all dealers
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: platformAdmin.id,
        dealerId: titanMotors.id,
      },
    },
    update: {},
    create: {
      userId: platformAdmin.id,
      dealerId: titanMotors.id,
    },
  });

  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: platformAdmin.id,
        dealerId: autoPro.id,
      },
    },
    update: {},
    create: {
      userId: platformAdmin.id,
      dealerId: autoPro.id,
    },
  });

  // Brandon (Multi-Dealer) has access to both dealers
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: multiDealerBrandon.id,
        dealerId: titanMotors.id,
      },
    },
    update: {},
    create: {
      userId: multiDealerBrandon.id,
      dealerId: titanMotors.id,
    },
  });

  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: multiDealerBrandon.id,
        dealerId: autoPro.id,
      },
    },
    update: {},
    create: {
      userId: multiDealerBrandon.id,
      dealerId: autoPro.id,
    },
  });

  // Ryan has access to Titan Motors only
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: ryanUser.id,
        dealerId: titanMotors.id,
      },
    },
    update: {},
    create: {
      userId: ryanUser.id,
      dealerId: titanMotors.id,
    },
  });

  // Lionel has access to AutoPro only
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: lionelUser.id,
        dealerId: autoPro.id,
      },
    },
    update: {},
    create: {
      userId: lionelUser.id,
      dealerId: autoPro.id,
    },
  });

  console.log('✓ Created user-dealer associations');

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - Dealers: ${await prisma.dealer.count()}`);
  console.log(`  - Users: ${await prisma.user.count()}`);
  console.log(`  - API Configs: ${await prisma.dealerApiConfig.count()}`);
  console.log(`  - User-Dealer Associations: ${await prisma.userDealer.count()}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

