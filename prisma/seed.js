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
      dealerShortCode: 'TM001',
      programId: 'PROG-123',
      subscriptionKey: 'encrypted_key_123',
      xUserEmail: 'api@titanmotors.com',
      deliveryEndpoint: 'https://authenticom.azure-api.net/dv-delivery/v1/delivery',
      jwtTokenUrl: 'https://authenticom.azure-api.net/dv-delivery/v1/token',
      fileTypeCode: 'SV',
      compareDateDefault: 1,
      lastSuccess: new Date('2024-10-07'),
      lastError: null,
      isActive: true,
    },
  });

  console.log('✓ Created API config for Titan Motors');

  // Create users
  console.log('👤 Creating users...');
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@titan.com' },
    update: {},
    create: {
      email: 'admin@titan.com',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      defaultDealerId: titanMotors.id,
      isActive: true,
    },
  });

  const multiDealerUser = await prisma.user.upsert({
    where: { email: 'manager@titanmotors.com' },
    update: {},
    create: {
      email: 'manager@titanmotors.com',
      name: 'Manager User',
      role: 'MULTI_DEALER',
      defaultDealerId: titanMotors.id,
      isActive: true,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@autopro.com' },
    update: {},
    create: {
      email: 'user@autopro.com',
      name: 'Regular User',
      role: 'USER',
      defaultDealerId: autoPro.id,
      isActive: true,
    },
  });

  console.log(`✓ Created users: ${superAdmin.name}, ${multiDealerUser.name}, ${regularUser.name}`);

  // Create user-dealer associations
  console.log('🔗 Creating user-dealer associations...');
  
  // Super admin has access to all dealers
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: superAdmin.id,
        dealerId: titanMotors.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      dealerId: titanMotors.id,
    },
  });

  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: superAdmin.id,
        dealerId: autoPro.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      dealerId: autoPro.id,
    },
  });

  // Manager has access to Titan Motors
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: multiDealerUser.id,
        dealerId: titanMotors.id,
      },
    },
    update: {},
    create: {
      userId: multiDealerUser.id,
      dealerId: titanMotors.id,
    },
  });

  // Regular user has access to AutoPro
  await prisma.userDealer.upsert({
    where: {
      userId_dealerId: {
        userId: regularUser.id,
        dealerId: autoPro.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
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

