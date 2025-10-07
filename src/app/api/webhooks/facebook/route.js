import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Webhook verification
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      return new Response(challenge, { status: 200 });
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
}

// Handle webhook events
export async function POST(request) {
  const body = await request.json();

  console.log('Facebook webhook received:', JSON.stringify(body, null, 2));

  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const change of entry.messaging || entry.changes || []) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id;
          const pageId = change.value.page_id;

          await processLead(leadId, pageId);
        }
      }
    }
  }

  return NextResponse.json({ status: 'ok' });
}

async function processLead(leadId, pageId) {
  try {
    // Find the connection for this page
    const connection = await prisma.facebookConnection.findFirst({
      where: { facebookPageId: pageId },
    });

    if (!connection || !connection.pageAccessToken) {
      console.error('No connection or token found for page:', pageId);
      return;
    }

    // Fetch lead data from Facebook
    const leadResponse = await fetch(`https://graph.facebook.com/v20.0/${leadId}?access_token=${connection.pageAccessToken}`);
    const leadData = await leadResponse.json();

    if (leadData.error) {
      console.error('Error fetching lead:', leadData.error);
      return;
    }

    console.log('Lead data:', leadData);

    // Save lead to database
    await prisma.lead.create({
      data: {
        userId: connection.crmUserId,
        formId: 0, // TODO: map to FacebookForm
        leadData,
      },
    });

    console.log('Lead saved for user:', connection.crmUserId);
  } catch (error) {
    console.error('Error processing lead:', error);
  }
}