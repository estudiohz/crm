import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  const { userId, pageId } = await request.json();

  if (!userId || !pageId) {
    return NextResponse.json({ error: 'User ID and Page ID required' }, { status: 400 });
  }

  try {
    const connection = await prisma.facebookConnection.findFirst({
      where: { crmUserId: userId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 });
    }

    const pages = connection.pagesData;
    const selectedPage = pages.find(page => page.id === pageId);

    if (!selectedPage || !selectedPage.accessToken) {
      return NextResponse.json({ error: 'Page not found or no access token' }, { status: 404 });
    }

    // Update the connection with selected page
    await prisma.facebookConnection.update({
      where: { crmUserId: userId },
      data: {
        facebookPageId: pageId,
        pageAccessToken: selectedPage.accessToken,
        updatedAt: new Date(),
      },
    });

    // Subscribe to webhook
    await subscribeToWebhook(pageId, selectedPage.accessToken);

    return NextResponse.json({ success: true, selectedPage });
  } catch (error) {
    console.error('Error selecting Facebook page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function subscribeToWebhook(pageId, pageAccessToken) {
  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`, {
      method: 'POST',
    });
    if (!response.ok) {
      console.error('Error subscribing to webhook:', await response.text());
    } else {
      console.log('Successfully subscribed to webhook for page:', pageId);
    }
  } catch (error) {
    console.error('Error in subscribeToWebhook:', error);
  }
}