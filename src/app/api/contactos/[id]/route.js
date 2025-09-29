// src/app/api/contactos/[id]/route.js

import prisma from '../../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para obtener un contacto por ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const contacto = await prisma.contacto.findUnique({
      where: { id: parseInt(id) },
    });

    if (!contacto) {
      return NextResponse.json({ message: 'Contacto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(contacto, { status: 200 });
  } catch (error) {
    console.error('Error al obtener contacto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para eliminar un contacto por ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const deletedContacto = await prisma.contacto.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Contacto eliminado', contacto: deletedContacto }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}