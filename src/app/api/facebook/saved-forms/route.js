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

    const connection = await prisma.facebookConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return NextResponse.json({ forms: [] });
    }

    const forms = await prisma.facebookForm.findMany({
      where: {
        connectionId: connection.id,
        isActive: true
      },
      include: {
        _count: {
          select: { leads: true }
        }
      }
    });

    // Add page name from pagesData
    const pagesData = connection.pagesData || [];
    const formsWithPageName = forms.map(form => {
      const page = pagesData.find(p => p.id === form.pageId);
      return {
        ...form,
        pageName: page ? page.name : 'N/A'
      };
    });

    return NextResponse.json({ forms: formsWithPageName });
  } catch (error) {
    console.error('Facebook saved forms get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}