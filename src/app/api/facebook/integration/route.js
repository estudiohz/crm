import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, appId, appSecret } = await request.json();

    if (!userId || !appId || !appSecret) {
      return NextResponse.json({ error: 'User ID, App ID and App Secret are required' }, { status: 400 });
    }

    const integration = await prisma.facebookIntegration.upsert({
      where: { userId },
      update: { appId, appSecret },
      create: { userId, appId, appSecret },
    });

    return NextResponse.json({ success: true, integration });
  } catch (error) {
    console.error('Facebook integration save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const integration = await prisma.facebookIntegration.findUnique({
      where: { userId },
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Facebook integration get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}