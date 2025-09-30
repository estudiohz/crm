const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el seeding de usuarios de prueba...');

  // Encriptar las contraseñas
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Crear Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@test.com' },
    update: {},
    create: {
      email: 'superadmin@test.com',
      name: 'Superadmin',
      password: hashedPassword,
      role: 'superadmin',
    },
  });
  console.log(`Usuario superadmin creado con ID: ${superadmin.id}`);

  // Crear Partner
  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@test.com' },
    update: {},
    create: {
      email: 'partner@test.com',
      name: 'Partner',
      password: hashedPassword,
      role: 'partner',
    },
  });
  console.log(`Usuario partner creado con ID: ${partnerUser.id}`);

  // Crear registro Partner
  const partner = await prisma.partner.upsert({
    where: { id: 1 }, // Since it's autoincrement, use a fixed id for upsert
    update: {},
    create: {
      partner: 'Partner Company',
      email: 'partner@test.com',
      telefono: '555-0000',
      estado: 'Activo',
    },
  });
  console.log(`Partner creado con ID: ${partner.id}`);

  // Crear Cuentas para el Partner
  const client1User = await prisma.user.upsert({
    where: { email: 'cuenta1@test.com' },
    update: {},
    create: {
      email: 'cuenta1@test.com',
      name: 'Cuenta Uno',
      password: hashedPassword,
      role: 'cuenta',
      partnerId: partnerUser.id, // Vinculado al partner user
    },
  });
  console.log(`Usuario cuenta1 creado con ID: ${client1User.id}`);

  const cuenta1 = await prisma.cuenta.upsert({
    where: { email: 'cuenta1@test.com' },
    update: {},
    create: {
      cuenta: 'Cuenta Uno',
      empresa: 'Empresa Uno',
      email: 'cuenta1@test.com',
      telefono: '123456789',
      imagen: 'https://placehold.co/50x50/3b82f6/FFFFFF?text=C1',
      estado: 'Activo',
      modulo: ['Crm'], // CRM always active
      partnerRecordId: partner.id, // Partner record id
    },
  });
  console.log(`Cuenta cuenta1 creado con ID: ${cuenta1.id}`);

  const client2User = await prisma.user.upsert({
    where: { email: 'cuenta2@test.com' },
    update: {},
    create: {
      email: 'cuenta2@test.com',
      name: 'Cuenta Dos',
      password: hashedPassword,
      role: 'cuenta',
      partnerId: partnerUser.id, // Vinculado al partner user
    },
  });
  console.log(`Usuario cuenta2 creado con ID: ${client2User.id}`);

  const cuenta2 = await prisma.cuenta.upsert({
    where: { email: 'cuenta2@test.com' },
    update: {},
    create: {
      cuenta: 'Cuenta Dos',
      empresa: 'Empresa Dos',
      email: 'cuenta2@test.com',
      telefono: '987654321',
      imagen: 'https://placehold.co/50x50/3b82f6/FFFFFF?text=C2',
      estado: 'Activo',
      modulo: ['Crm'], // CRM always active
      partnerRecordId: partner.id, // Partner record id
    },
  });
  console.log(`Cuenta cuenta2 creado con ID: ${cuenta2.id}`);

  console.log('Seeding completado con éxito.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });