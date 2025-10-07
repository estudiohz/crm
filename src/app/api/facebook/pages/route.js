import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const connection = await prisma.facebookConnection.findFirst({
      where: { crmUserId: userId },
    });

    console.log('Connection found:', connection);

    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 });
    }

    console.log('Pages data:', connection.pagesData);

    // Return the pages data
    return NextResponse.json({ pages: connection.pagesData });
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}