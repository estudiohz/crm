// src/app/api/facturas/route.js

import prisma from '../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para manejar las solicitudes GET (obtener facturas)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Obtener el usuario para verificar el rol
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let whereCondition = {};
    if (user.role !== 'superadmin') {
      whereCondition = { userId };
    }

    const facturas = await prisma.factura.findMany({
      where: whereCondition,
      include: {
        contacto: true,
        items: true,
      },
    });

    // Add nif from empresa
    for (const factura of facturas) {
      if (factura.contacto && factura.contacto.empresaId) {
        const empresa = await prisma.empresa.findUnique({
          where: { id: factura.contacto.empresaId },
        });
        if (empresa) {
          factura.contacto.nif = empresa.cifNie;
        }
      }
    }

    return NextResponse.json(facturas, { status: 200 });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes POST (añadir una factura)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);

    const { serie, numero, fecha, formaCobro, vencimiento, contactoId, items, userId, estado, informacionFiscal } = body;

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.total, 0);

    const newFactura = await prisma.factura.create({
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
          create: items,
        },
      },
      include: {
        contacto: true,
        items: true,
      },
    });

    console.log('Factura creada en la base de datos:', newFactura);

    return NextResponse.json(newFactura, { status: 201 });

  } catch (error) {
    console.error('Error al añadir factura:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir la factura', details: error.message }, { status: 500 });
  }
}