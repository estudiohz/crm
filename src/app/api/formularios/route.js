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
      SELECT * FROM "Formulario" WHERE "userId" = ${userId}
    `;

    // Parse mappings JSON
    const formulariosWithParsedMappings = formularios.map(formulario => ({
      ...formulario,
      mappings: formulario.mappings ? JSON.parse(formulario.mappings) : []
    }));

    return NextResponse.json(formulariosWithParsedMappings, { status: 200 });
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
    const { nombre, url, email, estado, mappings } = body;

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

    // Insert using raw SQL
    const insertResult = await prisma.$queryRaw`
      INSERT INTO "Formulario" ("nombre", "url", "email", "estado", "mappings", "webhookUrl", "webhookSecret", "userId", "createdAt", "updatedAt")
      VALUES (${nombre}, ${url}, ${email}, ${estado}, ${mappingsJson}::jsonb, '', ${webhookSecret}, ${userId}, NOW(), NOW())
      RETURNING *
    `;

    const newFormulario = insertResult[0];

    // Update webhook URL with actual ID
    const actualWebhookUrl = `https://crm-panel.g0ncz4.easypanel.host/webhooks/formulario/${newFormulario.id}`;
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

    const { id, nombre, url, email, estado, mappings, webhookUrl, webhookSecret } = body;

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

    const updateQuery = `
      UPDATE "Formulario"
      SET ${updateFields.join(', ')}
      WHERE "id" = $${paramIndex}
      RETURNING *
    `;

    const updatedFormulario = await prisma.$queryRaw(updateQuery, ...values);

    console.log('Formulario actualizado en la base de datos:', updatedFormulario[0]);

    return NextResponse.json(updatedFormulario[0], { status: 200 });

  } catch (error) {
    console.error('Error al actualizar formulario:', error);
    return NextResponse.json({ message: 'Error al actualizar el formulario' }, { status: 500 });
  }
}