import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const pageId = searchParams.get('pageId');

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const connection = await prisma.facebookConnection.findUnique({
    where: { userId }
  });

  if (!connection) {
    return NextResponse.json({ error: 'No conectado a Facebook' }, { status: 401 });
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?` +
    `access_token=${connection.accessToken}`
  );

  const forms = await response.json();
  return NextResponse.json(forms);
}

export async function POST(request) {
  try {
    const { userId, formId, formName, pageId } = await request.json();

    if (!userId || !formId || !formName || !pageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the connection
    const connection = await prisma.facebookConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 400 });
    }

    // Save or update the form
    const form = await prisma.facebookForm.upsert({
      where: {
        connectionId_formId: {
          connectionId: connection.id,
          formId
        }
      },
      update: {
        formName,
        pageId,
        isActive: true
      },
      create: {
        connectionId: connection.id,
        formId,
        formName,
        pageId,
        isActive: true
      },
    });

    return NextResponse.json({ success: true, form });
  } catch (error) {
    console.error('Facebook form save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}