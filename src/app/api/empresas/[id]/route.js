// src/app/api/empresas/[id]/route.js

import prisma from '../../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para manejar las solicitudes GET (obtener una empresa por ID)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(id) },
    });
    if (!empresa) {
      return NextResponse.json({ message: 'Empresa no encontrada' }, { status: 404 });
    }
    return NextResponse.json(empresa, { status: 200 });
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar una empresa)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { empresa, cifNie, email, telefono, estado, fechaCreacion, comunidad, direccion, cp, pais } = body;

    const updatedEmpresa = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: {
        empresa,
        cifNie,
        email,
        telefono,
        estado,
        fechaCreacion: fechaCreacion ? new Date(fechaCreacion.split('/').reverse().join('-')) : undefined,
        comunidad,
        direccion,
        cp,
        pais,
      },
    });

    return NextResponse.json(updatedEmpresa, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    return NextResponse.json({ message: 'Error al actualizar la empresa' }, { status: 500 });
  }
}

// Función para manejar las solicitudes DELETE (eliminar una empresa)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.empresa.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'Empresa eliminada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    return NextResponse.json({ message: 'Error al eliminar la empresa' }, { status: 500 });
  }
}