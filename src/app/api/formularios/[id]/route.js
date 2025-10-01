// src/app/api/formularios/[id]/route.js

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Función para obtener un formulario por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const formularios = await prisma.$queryRaw`
      SELECT * FROM "Formulario" WHERE "id" = ${parseInt(id)}
    `;

    if (!formularios || formularios.length === 0) {
      return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
    }

    const formulario = formularios[0];

    // Parse mappings JSON
    const formularioWithParsedMappings = {
      ...formulario,
      mappings: formulario.mappings ? JSON.parse(formulario.mappings) : []
    };

    return NextResponse.json(formularioWithParsedMappings, { status: 200 });
  } catch (error) {
    console.error('Error al obtener formulario:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para actualizar un formulario por ID
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Datos recibidos para actualizar formulario:', body);

    const { nombre, url, email, estado } = body;

    const updatedFormulario = await prisma.formulario.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        url,
        email,
        estado,
      },
    });

    console.log('Formulario actualizado:', updatedFormulario);

    return NextResponse.json(updatedFormulario, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar formulario:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para eliminar un formulario por ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const formularioId = parseInt(id);

    // Verificar si el formulario existe
    const formularios = await prisma.$queryRaw`
      SELECT * FROM "Formulario" WHERE "id" = ${formularioId}
    `;

    if (!formularios || formularios.length === 0) {
      return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
    }

    // Eliminar el formulario
    await prisma.$queryRaw`
      DELETE FROM "Formulario" WHERE "id" = ${formularioId}
    `;

    return NextResponse.json({ message: 'Formulario eliminado', formulario: formularios[0] }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar formulario:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}