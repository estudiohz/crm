import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  const { userId } = params;

  try {
    // Get the user and their webhook secret
    const user = await prisma.$queryRaw`SELECT "webhookSecret" FROM "User" WHERE id = ${userId}`;

    if (!user || user.length === 0 || !user[0].webhookSecret) {
      return NextResponse.json({ error: 'User not found or no webhook secret' }, { status: 404 });
    }

    // Parse the request body
    const body = await request.json();

    // Get the secret from the request body
    const providedSecret = body.webhook_secret;

    if (!providedSecret || providedSecret !== user[0].webhookSecret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    // Use body as data
    const data = body;

    // Here you can process the webhook data
    // For now, just log it
    console.log('Webhook received for user', userId, ':', data);

    // Optionally, store the data in a database table
    // You might want to create a WebhookLog model for this

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}