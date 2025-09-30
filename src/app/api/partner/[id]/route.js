// src/app/api/partner/[id]/route.js

import prisma from '../../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para obtener un partner por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
      include: {
        cuentas: true, // Incluir cuentas asociados
      },
    });

    if (!partner) {
      return NextResponse.json({ message: 'Partner no encontrado' }, { status: 404 });
    }

    return NextResponse.json(partner, { status: 200 });
  } catch (error) {
    console.error('Error al obtener partner:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para eliminar un partner por ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const partnerId = parseInt(id);

    // Verificar si el partner existe
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json({ message: 'Partner no encontrado' }, { status: 404 });
    }

    // Primero, desasociar cuentas
    await prisma.cuenta.updateMany({
      where: { partnerRecordId: partnerId },
      data: { partnerRecordId: null },
    });

    // Eliminar el partner
    const deletedPartner = await prisma.partner.delete({
      where: { id: partnerId },
    });

    return NextResponse.json({ message: 'Partner eliminado', partner: deletedPartner }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar partner:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}