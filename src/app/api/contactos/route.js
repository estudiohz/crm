// src/app/api/contactos/route.js

import prisma from '../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para manejar las solicitudes GET (obtener contactos)
export async function GET() {
  try {
    const contactos = await prisma.contacto.findMany();
    return NextResponse.json(contactos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para manejar las solicitudes POST (añadir un contacto)
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos del frontend:', body);

    // Desestructuración de los datos
    const { nombre, apellidos, email, telefono, empresa, estado, fechaCreacion, origen } = body;
    const lowerEmail = email.toLowerCase();

    // Verificar si el email ya existe
    const existingContacto = await prisma.contacto.findFirst({
      where: { email: lowerEmail },
    });
    if (existingContacto) {
      return NextResponse.json({ message: 'El email ya está registrado.' }, { status: 400 });
    }

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD' si se proporciona
    let formattedDate = new Date();
    if (fechaCreacion) {
      const [day, month, year] = fechaCreacion.split('/');
      formattedDate = new Date(`${year}-${month}-${day}`);
    }

    const newContacto = await prisma.contacto.create({
      data: {
        nombre,
        apellidos,
        email: lowerEmail,
        telefono,
        empresa,
        estado,
        fechaCreacion: formattedDate,
        origen,
      },
    });

    console.log('Contacto creado en la base de datos:', newContacto);

    return NextResponse.json(newContacto, { status: 201 });

  } catch (error) {
    console.error('Error al añadir contacto:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ message: 'Error al añadir el contacto', details: error.message }, { status: 500 });
  }
}

// Función para manejar las solicitudes PUT (actualizar un contacto)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('Datos recibidos para actualizar:', body);

    const { id, nombre, apellidos, email, telefono, empresa, estado, fechaCreacion, origen } = body;
    const lowerEmail = email.toLowerCase();

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaCreacion.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    const updatedContacto = await prisma.contacto.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        apellidos,
        email: lowerEmail,
        telefono,
        empresa,
        estado,
        fechaCreacion: formattedDate,
        origen,
      },
    });

    console.log('Contacto actualizado en la base de datos:', updatedContacto);

    return NextResponse.json(updatedContacto, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    return NextResponse.json({ message: 'Error al actualizar el contacto' }, { status: 500 });
  }
}