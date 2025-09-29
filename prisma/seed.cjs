const { PrismaClient } = require('../src/generated/prisma');
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
  const partner = await prisma.user.upsert({
    where: { email: 'partner@test.com' },
    update: {},
    create: {
      email: 'partner@test.com',
      name: 'Partner',
      password: hashedPassword,
      role: 'partner',
    },
  });
  console.log(`Usuario partner creado con ID: ${partner.id}`);

  // Crear Clientes para el Partner
  const client1User = await prisma.user.upsert({
    where: { email: 'cliente1@test.com' },
    update: {},
    create: {
      email: 'cliente1@test.com',
      name: 'Cliente Uno',
      password: hashedPassword,
      role: 'cliente',
      partnerId: partner.id, // Vinculado al partner
    },
  });
  console.log(`Usuario cliente1 creado con ID: ${client1User.id}`);

  const cliente1 = await prisma.cliente.upsert({
    where: { email: 'cliente1@test.com' },
    update: {},
    create: {
      cliente: 'Cliente Uno',
      empresa: 'Empresa Uno',
      email: 'cliente1@test.com',
      telefono: '123456789',
      imagen: 'https://placehold.co/50x50/3b82f6/FFFFFF?text=C1',
      estado: 'Activo',
      modulo: ['Crm', 'invoices'],
      partnerRecordId: partner.id,
    },
  });
  console.log(`Cliente cliente1 creado con ID: ${cliente1.id}`);

  const client2User = await prisma.user.upsert({
    where: { email: 'cliente2@test.com' },
    update: {},
    create: {
      email: 'cliente2@test.com',
      name: 'Cliente Dos',
      password: hashedPassword,
      role: 'cliente',
      partnerId: partner.id, // Vinculado al partner
    },
  });
  console.log(`Usuario cliente2 creado con ID: ${client2User.id}`);

  const cliente2 = await prisma.cliente.upsert({
    where: { email: 'cliente2@test.com' },
    update: {},
    create: {
      cliente: 'Cliente Dos',
      empresa: 'Empresa Dos',
      email: 'cliente2@test.com',
      telefono: '987654321',
      imagen: 'https://placehold.co/50x50/3b82f6/FFFFFF?text=C2',
      estado: 'Activo',
      modulo: ['Crm'],
      partnerRecordId: partner.id,
    },
  });
  console.log(`Cliente cliente2 creado con ID: ${cliente2.id}`);

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