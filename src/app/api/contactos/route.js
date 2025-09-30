// src/app/api/contactos/route.js

import prisma from '../../../../prisma/client';
import { NextResponse } from 'next/server';

// Función para manejar las solicitudes GET (obtener contactos)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const contactos = await prisma.contacto.findMany({
      where: { userId }
    });
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
    const { nombre, apellidos, email, telefono, empresa, estado, fechaCreacion, origen, direccion, localidad, comunidad, pais, cp, userId } = body;
    const lowerEmail = email.toLowerCase();

    // Verificar si el email ya existe para este usuario
    const existingContacto = await prisma.contacto.findFirst({
      where: { email: lowerEmail, userId },
    });
    if (existingContacto) {
      return NextResponse.json({ message: 'El email ya está registrado para este usuario.' }, { status: 400 });
    }

    // Buscar empresaId si empresa es proporcionada
    let empresaId = null;
    if (empresa) {
      const empresaRecord = await prisma.empresa.findFirst({
        where: { empresa, userId },
      });
      if (empresaRecord) {
        empresaId = empresaRecord.id;
      }
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
        direccion,
        localidad,
        comunidad,
        pais,
        cp,
        userId,
        empresaId,
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

    const { id, nombre, apellidos, email, telefono, empresa, estado, fechaCreacion, origen, direccion, localidad, comunidad, pais, cp, userId } = body;
    const lowerEmail = email.toLowerCase();

    // Verificar si el email ya existe para este usuario (excluyendo el contacto actual)
    const existingContacto = await prisma.contacto.findFirst({
      where: {
        email: lowerEmail,
        userId,
        NOT: { id: parseInt(id) }
      },
    });
    if (existingContacto) {
      return NextResponse.json({ message: 'El email ya está registrado para este usuario.' }, { status: 400 });
    }

    // Buscar empresaId si empresa es proporcionada
    let empresaId = null;
    if (empresa) {
      const empresaRecord = await prisma.empresa.findFirst({
        where: { empresa, userId },
      });
      if (empresaRecord) {
        empresaId = empresaRecord.id;
      }
    }

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
        direccion,
        localidad,
        comunidad,
        pais,
        cp,
        user: { connect: { id: userId } },
        ...(empresaId && { empresaRecord: { connect: { id: empresaId } } }),
      },
    });

    console.log('Contacto actualizado en la base de datos:', updatedContacto);

    return NextResponse.json(updatedContacto, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    return NextResponse.json({ message: 'Error al actualizar el contacto' }, { status: 500 });
  }
}