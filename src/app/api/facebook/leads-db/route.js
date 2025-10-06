import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const formId = searchParams.get('formId');

    if (!userId || !formId) {
      return NextResponse.json({ error: 'User ID and Form ID required' }, { status: 400 });
    }

    const leads = await prisma.lead.findMany({
      where: {
        userId: userId,
        formId: parseInt(formId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Facebook leads DB get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}