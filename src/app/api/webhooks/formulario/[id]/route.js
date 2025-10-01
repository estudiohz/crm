// src/app/api/webhooks/formulario/[id]/route.js

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Webhook received for formulario:', id, 'body:', body);

    // Get the formulario
    const formularios = await prisma.$queryRaw`
      SELECT id, nombre, url, email, estado, etiquetas, mappings, webhookUrl, webhookSecret, userId FROM "Formulario" WHERE "id" = ${parseInt(id)}
    `;

    if (!formularios || formularios.length === 0) {
      return NextResponse.json({ error: 'Formulario not found' }, { status: 404 });
    }

    const formulario = formularios[0];

    // Verify webhook secret
    const providedSecret = body.webhook_secret;
    if (!providedSecret || providedSecret !== formulario.webhookSecret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    // Parse mappings and etiquetas with error handling
    let mappings = [];
    let formularioEtiquetas = [];

    try {
      mappings = formulario.mappings && formulario.mappings !== 'null' && formulario.mappings !== '' ? JSON.parse(formulario.mappings) : [];
    } catch (e) {
      console.warn('Error parsing mappings for formulario webhook', formulario.id, e);
      mappings = [];
    }

    try {
      formularioEtiquetas = formulario.etiquetas && formulario.etiquetas !== 'null' && formulario.etiquetas !== '' ? JSON.parse(formulario.etiquetas) : [];
    } catch (e) {
      console.warn('Error parsing etiquetas for formulario webhook', formulario.id, e);
      formularioEtiquetas = [];
    }

    // Map form fields to contact fields
    const contactData = {};
    mappings.forEach(mapping => {
      if (body[mapping.formField]) {
        contactData[mapping.contactField] = body[mapping.formField];
      }
    });

    // Set default values if not mapped
    contactData.estado = contactData.estado || 'Activo';
    contactData.fechaCreacion = new Date();

    // Add userId from formulario
    contactData.userId = formulario.userId;

    // Automatically assign formulario's etiquetas to the contact
    // Combine any etiquetas from form mapping with formulario etiquetas
    const formEtiquetas = contactData.etiquetas || [];
    contactData.etiquetas = [...new Set([...formEtiquetas, ...formularioEtiquetas])];

    console.log('Creating contact with data:', contactData);

    // Create the contact using raw SQL
    const insertResult = await prisma.$queryRaw`
      INSERT INTO "Contacto" ("nombre", "apellidos", "email", "telefono", "empresa", "estado", "fechaCreacion", "origen", "direccion", "localidad", "comunidad", "pais", "cp", "fechaCumpleanos", "etiquetas", "userId", "createdAt", "updatedAt")
      VALUES (
        ${contactData.nombre || null},
        ${contactData.apellidos || null},
        ${contactData.email || null},
        ${contactData.telefono || null},
        ${contactData.empresa || null},
        ${contactData.estado},
        ${contactData.fechaCreacion},
        'Formulario',
        ${contactData.direccion || null},
        ${contactData.localidad || null},
        ${contactData.comunidad || null},
        ${contactData.pais || null},
        ${contactData.cp || null},
        ${contactData.fechaCumpleanos || null},
        ${contactData.etiquetas ? JSON.stringify(contactData.etiquetas) : null}::jsonb,
        ${contactData.userId},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const newContact = insertResult[0];

    console.log('Contact created:', newContact);

    return NextResponse.json({ success: true, contactId: newContact.id }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}