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

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('Error fetching Facebook connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    await prisma.facebookConnection.deleteMany({
      where: { crmUserId: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Facebook connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}