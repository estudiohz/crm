import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// 💡 Nuevo Helper: Para parsear JSON de forma segura, como en la ruta del webhook.
function safeJsonParse(data) {
    if (data === null || data === undefined || data === 'null' || data === '') {
        return [];
    }
    
    // Si ya es un objeto (array), lo devolvemos
    if (typeof data === 'object' && data !== null) {
        return Array.isArray(data) ? data : [];
    }
    
    // Intentar parsear la cadena
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            // Error al parsear (ej. si es una cadena vacía o JSON inválido)
            return [];
        }
    }
    
    return [];
}


// Función para manejar las solicitudes GET (obtener contactos)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

const contactos = await prisma.$queryRaw`SELECT * FROM "Contacto" WHERE "userId" = ${userId}`;

    // Parse JSON fields
    const contactosWithParsedFields = contactos.map(contacto => {
      // 🚨 CORRECCIÓN: Usamos safeJsonParse para manejar cadenas vacías, null o JSON incorrecto
      const etiquetas = safeJsonParse(contacto.etiquetas);
      
      return {
        ...contacto,
        etiquetas
      };
    });

    return NextResponse.json(contactosWithParsedFields, { status: 200 });
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
    const { nombre, apellidos, email, telefono, empresa, estado, fechaCreacion, origen, direccion, localidad, comunidad, pais, cp, fechaCumpleanos, etiquetas, userId } = body;

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

// Verificar si el email ya existe para este usuario
const existingContactos = await prisma.$queryRaw`SELECT id, email FROM "Contacto" WHERE "email" = ${lowerEmail} AND "userId" = ${userId}`;
    if (existingContactos.length > 0) {
      return NextResponse.json({ message: 'El email ya está registrado para este usuario.' }, { status: 400 });
    }

// Buscar empresaId si empresa es proporcionada
let empresaId = null;
if (empresa) {
const empresaRecords = await prisma.$queryRaw`SELECT * FROM "Empresa" WHERE "empresa" = ${empresa} AND "userId" = ${userId}`;
if (empresaRecords.length > 0) {
empresaId = empresaRecords[0].id;
}
}

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD' si se proporciona
    let formattedDate = new Date();
    if (fechaCreacion) {
      const [day, month, year] = fechaCreacion.split('/');
      formattedDate = new Date(`${year}-${month}-${day}`);
    }

    let formattedCumpleanos = null;
    if (fechaCumpleanos) {
      formattedCumpleanos = new Date(fechaCumpleanos);
    }

    const etiquetasJson = etiquetas ? JSON.stringify(etiquetas) : null;

    const newContacto = await prisma.$queryRaw`
      INSERT INTO "Contacto" ("nombre", "apellidos", "email", "telefono", "empresa", "estado", "fechaCreacion", "origen", "direccion", "localidad", "comunidad", "pais", "cp", "fechaCumpleanos", "etiquetas", "userId", "empresaId", "createdAt", "updatedAt")
      VALUES (${nombre}, ${apellidos}, ${lowerEmail}, ${telefono}, ${empresa}, ${estado}, ${formattedDate}, ${origen}, ${direccion}, ${localidad}, ${comunidad}, ${pais}, ${cp}, ${formattedCumpleanos}, ${etiquetasJson}::jsonb, ${userId}, ${empresaId}, NOW(), NOW())
      RETURNING *
    `;

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

    const { id, nombre, apellidos, email, telefono, empresa, estado, fechaCreacion, origen, direccion, localidad, comunidad, pais, cp, fechaCumpleanos, etiquetas, userId } = body;
    const lowerEmail = email.toLowerCase();

// Verificar si el email ya existe para este usuario (excluyendo el contacto actual)
const existingContactos = await prisma.$queryRaw`SELECT id, email FROM "Contacto" WHERE "email" = ${lowerEmail} AND "userId" = ${userId} AND "id" != ${parseInt(id)}`;
    if (existingContactos.length > 0) {
      return NextResponse.json({ message: 'El email ya está registrado para este usuario.' }, { status: 400 });
    }

// Buscar empresaId si empresa es proporcionada
let empresaId = null;
if (empresa) {
const empresaRecords = await prisma.$queryRaw`SELECT * FROM "Empresa" WHERE "empresa" = ${empresa} AND "userId" = ${userId}`;
if (empresaRecords.length > 0) {
empresaId = empresaRecords[0].id;
}
}

    // Convertir el formato de fecha de 'DD/MM/YYYY' a 'YYYY-MM-DD'
    const [day, month, year] = fechaCreacion.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);

    let formattedCumpleanos = null;
    if (fechaCumpleanos) {
      formattedCumpleanos = new Date(fechaCumpleanos);
    }

    const etiquetasJson = etiquetas ? JSON.stringify(etiquetas) : null;

    const updatedContacto = await prisma.$queryRaw`
      UPDATE "Contacto"
      SET "nombre" = ${nombre}, "apellidos" = ${apellidos}, "email" = ${lowerEmail}, "telefono" = ${telefono}, "empresa" = ${empresa}, "estado" = ${estado}, "fechaCreacion" = ${formattedDate}, "origen" = ${origen}, "direccion" = ${direccion}, "localidad" = ${localidad}, "comunidad" = ${comunidad}, "pais" = ${pais}, "cp" = ${cp}, "fechaCumpleanos" = ${formattedCumpleanos}, "etiquetas" = ${etiquetasJson}::jsonb, "empresaId" = ${empresaId}, "updatedAt" = NOW()
      WHERE "id" = ${parseInt(id)}
      RETURNING *
    `;

    console.log('Contacto actualizado en la base de datos:', updatedContacto);

    return NextResponse.json(updatedContacto, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    return NextResponse.json({ message: 'Error al actualizar el contacto' }, { status: 500 });
  }
}
