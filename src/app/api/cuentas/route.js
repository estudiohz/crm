// src/app/api/cuentas/route.js

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para manejar las solicitudes POST (añadir un cuenta)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);

    // Desestructuración de los datos
    const { cuenta, nombre, apellidos, empresa, email, telefono, password, imagen, estado, fechaAlta, modulo, partnerRecordId, partnerId } = body;
    const lowerEmail = email.toLowerCase();

    // Verificar si el email ya existe en User o Cuenta
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });
    const existingCuenta = await prisma.cuenta.findUnique({
      where: { email: lowerEmail },
    });
    if (existingUser || existingCuenta) {
      return NextResponse.json({ message: 'El email ya está registrado.' }, { status: 400 });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaAlta.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    // Crear el usuario y la cuenta en una transacción
    const result = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: lowerEmail,
          name: cuenta,
          password: hashedPassword,
          role: 'cuenta',
        },
      });

      const newCuenta = await prisma.cuenta.create({
        data: {
          cuenta,
          nombre,
          apellidos,
          empresa,
          email: lowerEmail,
          telefono,
          imagen,
          estado,
          fechaAlta: formattedDate,
          modulo,
          partnerRecordId: partnerRecordId || null,
          partnerId: partnerId || null,
        },
      });

      return { newUser, newCuenta };
    });

    console.log('Cuenta creado en la base de datos:', result.newCuenta);

    return NextResponse.json(result.newCuenta, { status: 201 });

  } catch (error) {
    console.error('Error al añadir cuenta:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir el cuenta', details: error.message }, { status: 500 });
  }
}

// Asegúrate de tener también la función GET para obtener los cuentas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let where = {};
    if (userId) {
      // Filter by partnerId for the user's cuentas
      where.partnerId = userId;
    }

    const cuentas = await prisma.cuenta.findMany({ where });
    return NextResponse.json(cuentas, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar un cuenta)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { id, cuenta, nombre, apellidos, empresa, email, telefono, password, imagen, estado, fechaAlta, modulo, partnerId } = body;
    const lowerEmail = email.toLowerCase();

    // Obtener el cuenta actual para el email antiguo
    const currentCuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id) },
    });
    if (!currentCuenta) {
      return NextResponse.json({ message: 'Cuenta no encontrado' }, { status: 404 });
    }
    const oldEmail = currentCuenta.email;

    // Verificar si el usuario existe por email primero
    let existingUser = await prisma.user.findUnique({
      where: { email: oldEmail },
    });
    console.log('Existing user found for oldEmail', oldEmail, ':', !!existingUser);

    // Si no se encuentra por email, buscar por nombre y rol 'cuenta' (para sincronizar si emails desincronizados)
    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: { name: cuenta, role: 'cuenta' },
      });
      console.log('Existing user found by name and role:', !!existingUser);
    }

    if (existingUser) {
      const updateData = { email: lowerEmail, name: cuenta };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      });
      console.log('User updated to email:', lowerEmail, 'name:', cuenta);
    } else if (password) {
      // Si no existe usuario pero se proporciona contraseña, crear uno nuevo
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: lowerEmail,
          name: cuenta,
          password: hashedPassword,
          role: 'cuenta',
        },
      });
      console.log('New user created for cuenta:', cuenta, 'email:', lowerEmail);
    } else {
      console.log('No user found and no password provided to create one for cuenta:', cuenta);
    }

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaAlta.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    // Use raw query to update since client may not have latest schema
    await prisma.$queryRaw`UPDATE "Cuenta"
       SET "cuenta" = ${cuenta}, "nombre" = ${nombre}, "apellidos" = ${apellidos}, "empresa" = ${empresa}, "email" = ${lowerEmail},
           "telefono" = ${telefono}, "imagen" = ${imagen}, "estado" = ${estado}, "fechaAlta" = ${formattedDate}, "modulo" = ${modulo},
           "partnerId" = ${partnerId || null}, "updatedAt" = NOW()
       WHERE "id" = ${parseInt(id)}`;

    const updatedCuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id) },
    });

    console.log('Cuenta actualizado en la base de datos:', updatedCuenta);

    return NextResponse.json(updatedCuenta, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    return NextResponse.json({ message: 'Error al actualizar el cuenta' }, { status: 500 });
  }
}