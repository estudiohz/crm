// src/app/api/formularios/route.js

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Función para manejar las solicitudes GET (obtener formularios)
export async function GET(request) {
  try {
    // Get user from query params or headers, assuming it's passed
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    const formularios = await prisma.$queryRaw`
      SELECT "id", "nombre", "url", "email", "estado", "etiquetas", "mappings", "webhookUrl", "webhookSecret", "userId", "createdAt", "updatedAt" FROM "Formulario" WHERE "userId" = ${userId}
    `;

    // Parse mappings and etiquetas JSON with robust handling
    const formulariosWithParsedData = formularios.map(formulario => {
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

      return {
        ...formulario,
        mappings,
        etiquetas
      };
    });

    return NextResponse.json(formulariosWithParsedData, { status: 200 });
  } catch (error) {
    console.error('Error al obtener formularios:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes POST (añadir un formulario)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);

    // Desestructuración de los datos
    const { nombre, url, email, estado, etiquetas, mappings } = body;

    // Get userId from body or assume it's passed
    const userId = body.userId; // Assuming it's sent from frontend

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Verificar si el usuario existe
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    // });
    // if (!user) {
    //   return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 400 });
    // }

    // Generate webhook URL and secret
    const webhookSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const mappingsJson = mappings ? JSON.stringify(mappings) : null;
    const etiquetasJson = etiquetas ? JSON.stringify(etiquetas) : null;

    // Insert using raw SQL
    const insertResult = await prisma.$queryRaw`
      INSERT INTO "Formulario" ("nombre", "url", "email", "estado", "etiquetas", "mappings", "webhookUrl", "webhookSecret", "userId", "createdAt", "updatedAt")
      VALUES (${nombre}, ${url}, ${email}, ${estado}, ${etiquetasJson}::jsonb, ${mappingsJson}::jsonb, '', ${webhookSecret}, ${userId}, NOW(), NOW())
      RETURNING *
    `;

    const newFormulario = insertResult[0];

    // Update webhook URL with actual ID
    const actualWebhookUrl = `https://crm-panel.g0ncz4.easypanel.host/api/webhooks/formulario/${newFormulario.id}`;
    await prisma.$queryRaw`
      UPDATE "Formulario"
      SET "webhookUrl" = ${actualWebhookUrl}
      WHERE "id" = ${newFormulario.id}
    `;

    const finalFormulario = { ...newFormulario, webhookUrl: actualWebhookUrl };

    console.log('Formulario creado en la base de datos:', finalFormulario);

    return NextResponse.json(finalFormulario, { status: 201 });

  } catch (error) {
    console.error('Error al añadir formulario:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir el formulario', details: error.message }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar un formulario)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { id, nombre, url, email, estado, etiquetas, mappings, webhookUrl, webhookSecret } = body;

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
    if (webhookUrl !== undefined) {
      updateFields.push(`"webhookUrl" = $${paramIndex++}`);
      values.push(webhookUrl);
    }
    if (webhookSecret !== undefined) {
      updateFields.push(`"webhookSecret" = $${paramIndex++}`);
      values.push(webhookSecret);
    }

    updateFields.push(`"updatedAt" = NOW()`);

    values.push(parseInt(id)); // for WHERE

    // Build the query dynamically
    const setClause = updateFields.join(', ');
    const whereClause = `"id" = $${paramIndex}`;

    const query = `UPDATE "Formulario" SET ${setClause} WHERE ${whereClause} RETURNING *`;

    const updatedFormulario = await prisma.$queryRawUnsafe(query, ...values);

    console.log('Formulario actualizado en la base de datos:', updatedFormulario[0]);

    return NextResponse.json(updatedFormulario[0], { status: 200 });

  } catch (error) {
    console.error('Error al actualizar formulario:', error);
    return NextResponse.json({ message: 'Error al actualizar el formulario' }, { status: 500 });
  }
}