import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Generate a new secret
    const newSecret = randomBytes(32).toString('hex');

    // Update the user using raw query to avoid client issues
    await prisma.$executeRaw`UPDATE "User" SET "webhookSecret" = ${newSecret} WHERE id = ${userId}`;

    return NextResponse.json({ newSecret });
  } catch (error) {
    console.error('Error regenerating webhook secret:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}