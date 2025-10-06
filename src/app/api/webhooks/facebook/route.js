import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Webhook verification (GET)
export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Receive leads (POST)
export async function POST(request) {
  const body = await request.json();

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field === 'leadgen') {
        const leadgenId = change.value.leadgen_id;
        const formId = change.value.form_id;
        const pageId = change.value.page_id;

        // Find which user this form belongs to
        const form = await prisma.facebookForm.findFirst({
          where: { formId: formId, isActive: true },
          include: { connection: true }
        });

        if (!form) continue;

        // Get lead data
        const leadResponse = await fetch(
          `https://graph.facebook.com/v18.0/${leadgenId}?` +
          `access_token=${form.connection.accessToken}`
        );

        const leadData = await leadResponse.json();

        // Save lead to CRM
        await prisma.lead.create({
          data: {
            userId: form.connection.userId,
            formId: form.id,
            leadData: leadData.field_data
          }
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}