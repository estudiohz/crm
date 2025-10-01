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

    // Parse mappings and etiquetas JSON with robust handling
    let mappings = [];
    let etiquetas = [];

    if (formulario.mappings) {
      // Handle different data formats from database
      if (Array.isArray(formulario.mappings)) {
        // Already parsed as array
        mappings = formulario.mappings;
      } else if (typeof formulario.mappings === 'string') {
        if (formulario.mappings === 'null' || formulario.mappings === '') {
          mappings = [];
        } else {
          try {
            mappings = JSON.parse(formulario.mappings);
            // Ensure it's an array
            if (!Array.isArray(mappings)) {
              mappings = [];
            }
          } catch (parseError) {
            console.warn('JSON parse error for mappings in formulario', formulario.id, ':', parseError.message, '- Raw value:', formulario.mappings);
            mappings = [];
          }
        }
      } else {
        mappings = [];
      }
    }

    if (formulario.etiquetas) {
      // Handle different data formats from database
      if (Array.isArray(formulario.etiquetas)) {
        // Already parsed as array
        etiquetas = formulario.etiquetas;
      } else if (typeof formulario.etiquetas === 'string') {
        if (formulario.etiquetas === 'null' || formulario.etiquetas === '') {
          etiquetas = [];
        } else {
          try {
            etiquetas = JSON.parse(formulario.etiquetas);
            // Ensure it's an array
            if (!Array.isArray(etiquetas)) {
              etiquetas = [];
            }
          } catch (parseError) {
            console.warn('JSON parse error for etiquetas in formulario', formulario.id, ':', parseError.message, '- Raw value:', formulario.etiquetas);
            // If JSON parsing fails, treat as single string value
            if (formulario.etiquetas.trim()) {
              etiquetas = [formulario.etiquetas.trim()];
              console.log('Converted string "' + formulario.etiquetas + '" to array:', etiquetas);
            } else {
              etiquetas = [];
            }
          }
        }
      } else {
        etiquetas = [];
      }
    }

    const formularioWithParsedData = {
      ...formulario,
      mappings,
      etiquetas
    };

    return NextResponse.json(formularioWithParsedData, { status: 200 });
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

    const { nombre, url, email, estado, etiquetas, mappings, webhookSecret } = body;

    const etiquetasJson = etiquetas !== undefined ? (etiquetas ? JSON.stringify(etiquetas) : null) : undefined;
    const mappingsJson = mappings !== undefined ? (mappings ? JSON.stringify(mappings) : null) : undefined;

    // Build update query dynamically
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updateFields.push(`"nombre" = $${paramIndex++}`);
      values.push(nombre);
    }
    if (url !== undefined) {
      updateFields.push(`"url" = $${paramIndex++}`);
      values.push(url);
    }
    if (email !== undefined) {
      updateFields.push(`"email" = $${paramIndex++}`);
      values.push(email);
    }
    if (estado !== undefined) {
      updateFields.push(`"estado" = $${paramIndex++}`);
      values.push(estado);
    }
    if (etiquetasJson !== undefined) {
      updateFields.push(`"etiquetas" = $${paramIndex++}::jsonb`);
      values.push(etiquetasJson);
    }
    if (mappingsJson !== undefined) {
      updateFields.push(`"mappings" = $${paramIndex++}::jsonb`);
      values.push(mappingsJson);
    }
    if (webhookSecret !== undefined) {
      updateFields.push(`"webhookSecret" = $${paramIndex++}`);
      values.push(webhookSecret);
    }

    updateFields.push(`"updatedAt" = NOW()`);

    values.push(parseInt(id)); // for WHERE

    const updateQuery = `
      UPDATE "Formulario"
      SET ${updateFields.join(', ')}
      WHERE "id" = $${paramIndex}
      RETURNING *
    `;

    const updatedFormularios = await prisma.$queryRawUnsafe(updateQuery, ...values);

    console.log('Formulario actualizado:', updatedFormularios[0]);

    return NextResponse.json(updatedFormularios[0], { status: 200 });
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