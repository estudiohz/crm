// src/app/api/partners/route.js

// Usa el nombre 'prisma' sin llaves ({}) para capturar la exportación por defecto
import prisma from '../../../../prisma/client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// Función para manejar las solicitudes POST (añadir un partner)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend para Partner:', body);
    
    // Desestructuración de los datos
    const { partner, empresa, email, telefono, password, imagen, estado, fechaAlta, clients } = body;
    const lowerEmail = email.toLowerCase();

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });
    if (existingUser) {
      return NextResponse.json({ message: 'El email ya está registrado.' }, { status: 400 });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        email: lowerEmail,
        name: partner,
        password: hashedPassword,
        role: 'partner',
      },
    });

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaAlta.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    // CAMBIO CLAVE: Usa prisma.partner.create en lugar de prisma.cliente.create
    const newPartner = await prisma.partner.create({
      data: {
        // Los nombres de campo deben coincidir con tu esquema 'Partner'
        partner, // Nombre del partner
        empresa,
        email: lowerEmail,
        telefono,
        imagen,
        estado,
        fechaAlta: formattedDate, // Asegúrate de que el tipo de datos coincida con tu esquema de Prisma
      },
    });

    console.log('Partner creado en la base de datos:', newPartner);

    // Asociar cuentas si se proporcionaron
    if (clients && clients.length > 0) {
      await prisma.cuenta.updateMany({
        where: {
          id: { in: clients },
        },
        data: {
          partnerRecordId: newPartner.id,
        },
      });
    }

    return NextResponse.json(newPartner, { status: 201 });

  } catch (error) {
    console.error('Error al añadir partner:', error);
    return NextResponse.json({ message: 'Error al añadir el partner' }, { status: 500 });
  }
}

// Asegúrate de tener también la función GET para obtener los partners
export async function GET() {
  try {
    // CAMBIO CLAVE: Usa prisma.partner.findMany en lugar de prisma.cuenta.findMany
    const partners = await prisma.partner.findMany({
      include: {
        cuentas: true, // Incluir cuentas para contar
      },
    });
    // Añadir el conteo de cuentas
    const partnersWithCount = partners.map(partner => ({
      ...partner,
      numCuentas: partner.cuentas.length,
    }));
    console.log('Partners fetched from DB:', partnersWithCount);
    return NextResponse.json(partnersWithCount, { status: 200 });
  } catch (error) {
    console.error('Error al obtener partners:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar un partner)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar Partner:', body);

    const { id, partner, empresa, email, telefono, password, imagen, estado, fechaAlta, clients } = body;
    const lowerEmail = email.toLowerCase();

    // Obtener el partner actual
    const currentPartner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    });
    if (!currentPartner) {
      return NextResponse.json({ message: 'Partner no encontrado' }, { status: 404 });
    }
    const oldEmail = currentPartner.email;

    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { email: oldEmail },
    });
    console.log('Password provided for update:', !!password, password ? password.length : 0);

    if (existingUser) {
      const updateData = { email: lowerEmail, name: partner };
      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
      console.log('User updated for partner:', partner);
    } else if (password && password.trim() !== '') {
      // Si no existe usuario pero se proporciona contraseña, crear uno nuevo
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: lowerEmail,
          name: partner,
          password: hashedPassword,
          role: 'partner',
        },
      });
      console.log('New user created for partner:', partner, 'email:', lowerEmail, 'id:', newUser.id);
    } else {
      console.log('No user found and no valid password provided to create one for partner:', partner);
    }

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaAlta.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const updatedPartner = await prisma.partner.update({
      where: { id: parseInt(id) },
      data: {
        partner,
        empresa,
        email: lowerEmail,
        telefono,
        imagen,
        estado,
        fechaAlta: formattedDate,
      },
    });

    // Actualizar asociaciones de cuentas
    if (clients !== undefined) {
      // Primero, remover asociaciones existentes
      await prisma.cuenta.updateMany({
        where: { partnerRecordId: parseInt(id) },
        data: { partnerRecordId: null },
      });
      // Luego, asociar los nuevos cuentas
      if (clients.length > 0) {
        await prisma.cuenta.updateMany({
          where: { id: { in: clients } },
          data: { partnerRecordId: parseInt(id) },
        });
      }
    }

    console.log('Partner actualizado en la base de datos:', updatedPartner);

    return NextResponse.json(updatedPartner, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar partner:', error);
    return NextResponse.json({ message: 'Error al actualizar el partner' }, { status: 500 });
  }
}
