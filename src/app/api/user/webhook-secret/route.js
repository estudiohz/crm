import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const user = await prisma.$queryRaw`SELECT "webhookSecret" FROM "User" WHERE id = ${userId}`;

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let webhookSecret = user[0].webhookSecret;

    if (!webhookSecret) {
      // Generate a new secret
      webhookSecret = randomBytes(32).toString('hex');
      await prisma.$executeRaw`UPDATE "User" SET "webhookSecret" = ${webhookSecret} WHERE id = ${userId}`;
    }

    return NextResponse.json({ webhookSecret });
  } catch (error) {
    console.error('Error fetching webhook secret:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}