// src/app/api/facturas/[id]/route.js

import prisma from '../../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para manejar las solicitudes GET (obtener una factura específica)
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const factura = await prisma.factura.findUnique({
      where: { id: parseInt(id) },
      include: {
        contacto: true,
        items: true,
      },
    });

    if (!factura) {
      return NextResponse.json({ message: 'Factura no encontrada' }, { status: 404 });
    }

    return NextResponse.json(factura, { status: 200 });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar una factura)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { serie, numero, fecha, formaCobro, vencimiento, contactoId, items, userId, estado, informacionFiscal } = body;

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.total, 0);

    // Update factura
    const updatedFactura = await prisma.factura.update({
      where: { id: parseInt(id) },
      data: {
        serie,
        numero: parseInt(numero),
        fecha: new Date(fecha),
        formaCobro,
        vencimiento: new Date(vencimiento),
        contacto: { connect: { id: parseInt(contactoId) } },
        user: { connect: { id: userId } },
        total,
        estado,
        informacionFiscal,
        items: {
          deleteMany: {}, // Delete existing items
          create: items.map(item => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio: item.precio,
            descuento: item.descuento,
            iva: item.iva,
            total: item.total,
            retencion: item.retencion,
          })),
        },
      },
      include: {
        contacto: true,
        items: true,
      },
    });

    console.log('Factura actualizada en la base de datos:', updatedFactura);

    return NextResponse.json(updatedFactura, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar factura:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al actualizar la factura', details: error.message }, { status: 500 });
  }
}

// Función para manejar las solicitudes DELETE (eliminar una factura)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await prisma.factura.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Factura eliminada' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}