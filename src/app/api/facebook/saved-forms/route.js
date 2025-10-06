import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const forms = await prisma.facebookForm.findMany({
      where: {
        connection: {
          userId: userId
        },
        isActive: true
      },
      include: {
        _count: {
          select: { leads: true }
        }
      }
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Facebook saved forms get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}