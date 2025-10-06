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
    const { userId, formId, formName, pageId, pageName } = await request.json();

    if (!userId || !formId || !formName || !pageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the Facebook connection for this user
    const connection = await prisma.facebookConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 });
    }

    // Check if form already exists
    const existingForm = await prisma.facebookForm.findFirst({
      where: {
        connectionId: connection.id,
        formId: formId
      }
    });

    if (existingForm) {
      return NextResponse.json({ error: 'Form already imported' }, { status: 409 });
    }

    // Create the Facebook form
    const facebookForm = await prisma.facebookForm.create({
      data: {
        connectionId: connection.id,
        formId,
        formName,
        pageId,
        mappedFields: {}, // Empty mapping initially
        isActive: true
      }
    });

    return NextResponse.json({ success: true, form: facebookForm });
  } catch (error) {
    console.error('Error creating Facebook form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
