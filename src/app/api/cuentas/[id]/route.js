// src/app/api/cuentas/[id]/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para obtener un cuenta por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cuenta) {
      return NextResponse.json({ message: 'Cuenta no encontrado' }, { status: 404 });
    }

    return NextResponse.json(cuenta, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para eliminar un cuenta por ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cuenta) {
      return NextResponse.json({ message: 'Cuenta no encontrado' }, { status: 404 });
    }

    await prisma.cuenta.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Cuenta eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}