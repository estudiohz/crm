import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  const { userId, formId, formName, pageId, pageName } = await request.json();

  if (!userId || !formId || !formName || !pageId || !pageName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get the Facebook connection
    const connection = await prisma.facebookConnection.findFirst({
      where: { crmUserId: userId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 });
    }

    // Create the Facebook form
    const facebookForm = await prisma.facebookForm.create({
      data: {
        connectionId: connection.id,
        formId: formId,
        formName: formName,
        pageId: pageId,
      },
    });

    // Also create a regular Formulario for webhook handling
    const webhookSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const formulario = await prisma.formulario.create({
      data: {
        nombre: formName,
        url: `https://facebook.com/${pageId}`,
        email: '', // Will be set later
        estado: 'activo',
        etiquetas: [],
        mappings: {},
        webhookSecret: webhookSecret,
        userId: userId,
      },
    });

    // Update webhook URL
    const webhookUrl = `https://crm-panel.g0ncz4.easypanel.host/api/webhooks/formulario/${formulario.id}`;
    await prisma.formulario.update({
      where: { id: formulario.id },
      data: { webhookUrl: webhookUrl },
    });

    // Update Facebook form with formulario ID
    await prisma.facebookForm.update({
      where: { id: facebookForm.id },
      data: { formularioId: formulario.id }, // Assuming we add this field
    });

    return NextResponse.json({
      facebookForm,
      formulario,
      formId: formulario.id
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating Facebook form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}