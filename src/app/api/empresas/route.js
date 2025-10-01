// src/app/api/empresas/route.js

import prisma from '../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para manejar las solicitudes GET (obtener empresas)
export async function GET(request) {
  try {
    // Get user from query params or headers, assuming it's passed
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    const empresas = await prisma.empresa.findMany({
      where: { userId },
    });
    return NextResponse.json(empresas, { status: 200 });
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes POST (añadir una empresa)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);

    // Desestructuración de los datos
    const { empresa, cifNie, email, telefono, estado, fechaCreacion, comunidad, direccion, cp, pais } = body;

    // Get userId from body or assume it's passed
    const userId = body.userId; // Assuming it's sent from frontend

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 400 });
    }

    // Verificar si el email ya existe
    const existingEmpresa = await prisma.empresa.findFirst({
      where: { email },
    });
    if (existingEmpresa) {
      return NextResponse.json({ message: 'El email ya está registrado.' }, { status: 400 });
    }

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD' si se proporciona
    let formattedDate = new Date();
    if (fechaCreacion) {
      const [day, month, year] = fechaCreacion.split('/');
      formattedDate = new Date(`${year}-${month}-${day}`);
    }

    const newEmpresa = await prisma.empresa.create({
      data: {
        empresa,
        cifNie,
        email,
        telefono,
        estado,
        fechaCreacion: formattedDate,
        comunidad,
        direccion,
        cp,
        pais,
        userId,
      },
    });

    console.log('Empresa creada en la base de datos:', newEmpresa);

    return NextResponse.json(newEmpresa, { status: 201 });

  } catch (error) {
    console.error('Error al añadir empresa:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir la empresa', details: error.message }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar una empresa)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { id, empresa, cifNie, email, telefono, estado, fechaCreacion, comunidad, direccion, cp, pais } = body;

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaCreacion.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const updatedEmpresa = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: {
        empresa,
        cifNie,
        email,
        telefono,
        estado,
        fechaCreacion: formattedDate,
        comunidad,
        direccion,
        cp,
        pais,
      },
    });

    console.log('Empresa actualizada en la base de datos:', updatedEmpresa);

    return NextResponse.json(updatedEmpresa, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    return NextResponse.json({ message: 'Error al actualizar la empresa' }, { status: 500 });
  }
}