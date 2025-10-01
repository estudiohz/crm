// src/app/api/etiquetas/route.js

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Función para manejar las solicitudes GET (obtener etiquetas)
export async function GET(request) {
  try {
    // Get user from query params or headers, assuming it's passed
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    const etiquetas = await prisma.$queryRaw`
      SELECT id, nombre, color, descripcion, "userId", "createdAt", "updatedAt" FROM "Etiqueta" WHERE "userId" = ${userId}
    `;

    return NextResponse.json(etiquetas, { status: 200 });
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes POST (añadir una etiqueta)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);

    // Desestructuración de los datos
    const { nombre, color, descripcion } = body;

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

    // Verificar si el nombre ya existe para este usuario
    const existingEtiqueta = await prisma.$queryRaw`
      SELECT * FROM "Etiqueta" WHERE "nombre" = ${nombre} AND "userId" = ${userId}
    `;
    if (existingEtiqueta.length > 0) {
      return NextResponse.json({ message: 'Ya existe una etiqueta con este nombre.' }, { status: 400 });
    }
    if (existingEtiqueta.length > 0) {
      return NextResponse.json({ message: 'Ya existe una etiqueta con este nombre.' }, { status: 400 });
    }

    const newEtiqueta = await prisma.$queryRaw`
      INSERT INTO "Etiqueta" ("nombre", "color", "descripcion", "userId", "createdAt", "updatedAt")
      VALUES (${nombre}, ${color}, ${descripcion || null}, ${userId}, NOW(), NOW())
      RETURNING "id", "nombre", "color", "descripcion", "userId", "createdAt", "updatedAt"
    `;

    console.log('Etiqueta creada en la base de datos:', newEtiqueta);

    return NextResponse.json(newEtiqueta[0], { status: 201 });

  } catch (error) {
    console.error('Error al añadir etiqueta:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir la etiqueta', details: error.message }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar una etiqueta)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { id, nombre, color, descripcion } = body;

    const updatedEtiqueta = await prisma.$queryRaw`
      UPDATE "Etiqueta"
      SET "nombre" = ${nombre}, "color" = ${color}, "descripcion" = ${descripcion || null}, "updatedAt" = NOW()
      WHERE "id" = ${parseInt(id)}
      RETURNING "id", "nombre", "color", "descripcion", "userId", "createdAt", "updatedAt"
    `;

    console.log('Etiqueta actualizada en la base de datos:', updatedEtiqueta);

    return NextResponse.json(updatedEtiqueta[0], { status: 200 });

  } catch (error) {
    console.error('Error al actualizar etiqueta:', error);
    return NextResponse.json({ message: 'Error al actualizar la etiqueta' }, { status: 500 });
  }
}