// src/app/api/etiquetas/[id]/route.js

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Función para obtener una etiqueta por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const etiqueta = await prisma.$queryRaw`
      SELECT "id", "nombre", "color", "descripcion", "userId", "createdAt", "updatedAt" FROM "Etiqueta" WHERE "id" = ${parseInt(id)}
    `;

    if (etiqueta.length === 0) {
      return NextResponse.json({ message: 'Etiqueta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(etiqueta[0], { status: 200 });
  } catch (error) {
    console.error('Error al obtener etiqueta:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para actualizar una etiqueta por ID
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Datos recibidos para actualizar etiqueta:', body);

    const { nombre, color, descripcion } = body;

    const updatedEtiqueta = await prisma.$queryRaw`
      UPDATE "Etiqueta"
      SET "nombre" = ${nombre}, "color" = ${color}, "descripcion" = ${descripcion || null}, "updatedAt" = NOW()
      WHERE "id" = ${parseInt(id)}
      RETURNING "id", "nombre", "color", "descripcion", "userId", "createdAt", "updatedAt"
    `;

    if (updatedEtiqueta.length === 0) {
      return NextResponse.json({ message: 'Etiqueta no encontrada' }, { status: 404 });
    }

    console.log('Etiqueta actualizada:', updatedEtiqueta);

    return NextResponse.json(updatedEtiqueta[0], { status: 200 });
  } catch (error) {
    console.error('Error al actualizar etiqueta:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para eliminar una etiqueta por ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const etiquetaId = parseInt(id);

    // Verificar si la etiqueta existe
    const etiqueta = await prisma.$queryRaw`
      SELECT "id", "nombre", "color", "descripcion", "userId" FROM "Etiqueta" WHERE "id" = ${etiquetaId}
    `;

    if (etiqueta.length === 0) {
      return NextResponse.json({ message: 'Etiqueta no encontrada' }, { status: 404 });
    }

    // Eliminar la etiqueta
    const deletedEtiqueta = await prisma.$queryRaw`
      DELETE FROM "Etiqueta" WHERE "id" = ${etiquetaId}
      RETURNING "id", "nombre", "color", "descripcion", "userId"
    `;

    return NextResponse.json({ message: 'Etiqueta eliminada', etiqueta: deletedEtiqueta[0] }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}