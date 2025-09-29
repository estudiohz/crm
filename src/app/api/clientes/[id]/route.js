// src/app/api/clientes/[id]/route.js

import prisma from '../../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para obtener un cliente por ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cliente) {
      return NextResponse.json({ message: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}