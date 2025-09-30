// src/app/api/clientes/route.js

// Usa el nombre 'prisma' sin llaves ({}) para capturar la exportación por defecto
import prisma from '../../../../prisma/client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// Función para manejar las solicitudes POST (añadir un cliente)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);
    
    // Desestructuración de los datos
    const { cliente, empresa, email, telefono, password, imagen, estado, fechaAlta, modulo, partnerRecordId, partnerId } = body;
    const lowerEmail = email.toLowerCase();

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
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
        name: cliente,
        password: hashedPassword,
        role: 'cliente',
      },
    });

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaAlta.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const newCliente = await prisma.cliente.create({
      data: {
        cliente,
        empresa,
        email: lowerEmail,
        telefono,
        imagen,
        estado,
        fechaAlta: formattedDate, // Asegúrate de que el tipo de datos coincida con tu esquema de Prisma
        modulo,
        partnerRecordId: partnerRecordId || null,
        partnerId: partnerId || null,
      },
    });

    console.log('Cliente creado en la base de datos:', newCliente);

    return NextResponse.json(newCliente, { status: 201 });

  } catch (error) {
    console.error('Error al añadir cliente:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir el cliente', details: error.message }, { status: 500 });
  }
}

// Asegúrate de tener también la función GET para obtener los clientes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let where = {};
    if (userId) {
      // Filter by partnerId for the user's clientes
      where.partnerId = userId;
    }

    const clientes = await prisma.cliente.findMany({ where });
    return NextResponse.json(clientes, { status: 200 });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar un cliente)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { id, cliente, empresa, email, telefono, password, imagen, estado, fechaAlta, modulo, partnerId } = body;
    const lowerEmail = email.toLowerCase();

    // Obtener el cliente actual para el email antiguo
    const currentCliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
    });
    if (!currentCliente) {
      return NextResponse.json({ message: 'Cliente no encontrado' }, { status: 404 });
    }
    const oldEmail = currentCliente.email;

    // Verificar si el usuario existe por email primero
    let existingUser = await prisma.user.findUnique({
      where: { email: oldEmail },
    });
    console.log('Existing user found for oldEmail', oldEmail, ':', !!existingUser);

    // Si no se encuentra por email, buscar por nombre y rol 'cliente' (para sincronizar si emails desincronizados)
    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: { name: cliente, role: 'cliente' },
      });
      console.log('Existing user found by name and role:', !!existingUser);
    }

    if (existingUser) {
      const updateData = { email: lowerEmail, name: cliente };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
      console.log('User updated to email:', lowerEmail, 'name:', cliente);
    } else if (password) {
      // Si no existe usuario pero se proporciona contraseña, crear uno nuevo
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: lowerEmail,
          name: cliente,
          password: hashedPassword,
          role: 'cliente',
        },
      });
      console.log('New user created for cliente:', cliente, 'email:', lowerEmail);
    } else {
      console.log('No user found and no password provided to create one for cliente:', cliente);
    }

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaAlta.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const updatedCliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        cliente,
        empresa,
        email: lowerEmail,
        telefono,
        imagen,
        estado,
        fechaAlta: formattedDate,
        modulo,
        partnerId: partnerId || undefined,
      },
    });

    console.log('Cliente actualizado en la base de datos:', updatedCliente);

    return NextResponse.json(updatedCliente, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json({ message: 'Error al actualizar el cliente' }, { status: 500 });
  }
}