import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    try {
        const formularioId = parseInt(params.id);
        if (isNaN(formularioId)) {
            return NextResponse.json({ error: 'ID de formulario no válido' }, { status: 400 });
        }

        const testPayload = await prisma.formularioTestPayload.findFirst({
            where: { formularioId: formularioId },
            orderBy: { createdAt: 'desc' },
            select: { payloadKeys: true }
        });

        if (!testPayload) {
            return NextResponse.json({ payloadKeys: [] }, { status: 200 });
        }

        return NextResponse.json({ payloadKeys: testPayload.payloadKeys }, { status: 200 });

    } catch (error) {
        console.error('Error fetching test keys:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}