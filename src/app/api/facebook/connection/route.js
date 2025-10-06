import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, facebookUserId, accessToken, tokenExpiresAt, pagesData } = await request.json();

    if (!userId || !facebookUserId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await prisma.facebookConnection.upsert({
      where: { userId },
      update: {
        facebookUserId,
        accessToken,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        pagesData
      },
      create: {
        userId,
        facebookUserId,
        accessToken,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        pagesData
      },
    });

    return NextResponse.json({ success: true, connection });
  } catch (error) {
    console.error('Facebook connection save error:', error);
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

    const connection = await prisma.facebookConnection.findUnique({
      where: { userId },
    });

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('Facebook connection get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}