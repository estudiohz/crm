import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper para parsear JSON de forma segura
function safeJsonParse(jsonString) {
    if (!jsonString || jsonString === 'null' || jsonString === '') {
        return [];
    }
    try {
        // Aseguramos que el resultado sea un array para evitar errores posteriores.
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Error al parsear JSON:', e);
        return [];
    }
}

export async function POST(request, { params }) {
    let connectionId;
    try {
        console.log('Webhook POST request received for params:', params);
        // 1. Obtener y validar el ID
        connectionId = parseInt(params.id);
        console.log('Parsed connectionId:', connectionId);
        if (isNaN(connectionId)) {
            console.log('Invalid connectionId, returning 400');
            return NextResponse.json({ error: 'ID de formulario no válido' }, { status: 400 });
        }

        let body;
        const contentType = request.headers.get('content-type');
        console.log('Content-Type:', contentType);

        // 2. Parsear el cuerpo de la solicitud (Mejor manejo de form-data)
        if (contentType && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data'))) {
            console.log('Parsing as form-data');
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        } else {
            // Asume JSON si no es form-data, o usa fallback
            console.log('Attempting to parse as JSON');
            try {
                body = await request.json();
            } catch (e) {
                 // Si no puede parsear como JSON, el body es irreconocible.
                 console.warn('Body de solicitud no es JSON válido.', e);
                 return NextResponse.json({ error: 'Formato de datos no compatible' }, { status: 400 });
            }
        }
        console.log('Parsed body:', body);

        console.log('Webhook received for formulario:', connectionId, 'body:', body);

        // 3. Buscar el formulario (Usando método findUnique de Prisma)
        console.log('Querying formulario with id:', connectionId);
        const formulario = await prisma.formulario.findUnique({
            where: { id: connectionId },
            // Selecciona explícitamente los campos necesarios
            select: {
                id: true,
                webhookSecret: true,
                mappings: true,
                etiquetas: true,
                userId: true,
                // Agrega aquí cualquier otro campo que necesites para el mapeo
            }
        });
        console.log('Formulario found:', !!formulario);
        if (formulario) {
            console.log('Formulario details:', { id: formulario.id, webhookSecret: formulario.webhookSecret ? 'present' : 'missing', userId: formulario.userId });
        }

        if (!formulario) {
            return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
        }

        // 4. Verificar la clave secreta
        const providedSecret = body.webhook_secret;
        console.log('Provided secret:', providedSecret ? 'present' : 'missing');
        console.log('Expected secret:', formulario.webhookSecret ? 'present' : 'missing');
        if (!providedSecret || providedSecret !== formulario.webhookSecret) {
            console.warn(`Intento de acceso denegado para ID: ${connectionId}. Clave inválida. Provided: ${providedSecret}, Expected: ${formulario.webhookSecret}`);
            return NextResponse.json({ error: 'Clave secreta de webhook inválida' }, { status: 403 });
        }
        console.log('Secret verification passed');
        
        // 5. Preparar y parsear mappings y etiquetas
        delete body.webhook_secret; // Remover la clave secreta del cuerpo del contacto
        console.log('Body after removing secret:', body);

        // Asumiendo que Prisma devuelve los campos JSONB como strings, los parseamos.
        console.log('Raw mappings:', formulario.mappings);
        console.log('Raw etiquetas:', formulario.etiquetas);
        const mappings = safeJsonParse(formulario.mappings);
        const formularioEtiquetas = safeJsonParse(formulario.etiquetas);
        console.log('Parsed mappings:', mappings);
        console.log('Parsed formularioEtiquetas:', formularioEtiquetas);


        // 6. Mapear campos del formulario a campos de Contacto
        const contactData = {};
        mappings.forEach(mapping => {
            if (body[mapping.formField]) {
                // Asegurar que el valor no sea una cadena vacía si el campo debe ser nullable
                const value = body[mapping.formField].toString().trim();
                contactData[mapping.contactField] = value.length > 0 ? value : null;
            }
        });

        // 7. Establecer datos por defecto y etiquetas
        // Los valores por defecto se aplican solo si no fueron mapeados
        contactData.estado = contactData.estado || 'Activo';
        contactData.fechaCreacion = contactData.fechaCreacion || new Date();
        contactData.userId = formulario.userId;

        // Combina etiquetas del formulario (si existen) con las etiquetas del formulario en DB
        const formEtiquetas = safeJsonParse(contactData.etiquetas);
        contactData.etiquetas = [...new Set([...formEtiquetas, ...formularioEtiquetas])];

        console.log('Creando contacto con datos:', contactData);

        // 8. Crear el Contacto (Usando método create de Prisma)
        console.log('Attempting to create contacto in database');
        const newContact = await prisma.contacto.create({
            data: {
                // Mapeo directo y defensivo de campos.
                // Usamos la coalescencia (||) para asegurar que los campos opcionales no sean 'undefined'.
                nombre: contactData.nombre || null,
                apellidos: contactData.apellidos || null,
                email: contactData.email || null,
                telefono: contactData.telefono || null,
                empresa: contactData.empresa || null,
                estado: contactData.estado,
                fechaCreacion: contactData.fechaCreacion,
                origen: 'Formulario', // Origen fijo
                direccion: contactData.direccion || null,
                localidad: contactData.localidad || null,
                comunidad: contactData.comunidad || null,
                pais: contactData.pais || null,
                cp: contactData.cp || null,
                fechaCumpleanos: contactData.fechaCumpleanos || null,
                // Prisma requiere un Array/Objeto para JSONB. Si está vacío, debe ser [].
                etiquetas: contactData.etiquetas.length > 0 ? contactData.etiquetas : [],
                userId: contactData.userId,
                // Los demás campos (createdAt, updatedAt) son gestionados por el esquema de Prisma.
            }
        });
        console.log('Contacto created successfully:', newContact.id);

        console.log('Contacto creado:', newContact);

        return NextResponse.json({ success: true, contactId: newContact.id }, { status: 200 });

    } catch (error) {
        console.error('Exception caught in webhook handler');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);

        // 🚨 Manejo de errores de Prisma 🚨
        if (error.code) {
             console.error(`Error de Prisma (${error.code}) en el Webhook para ID ${connectionId || 'desconocido'}:`, error.message);
        } else {
             console.error(`Error genérico en el Webhook para ID ${connectionId || 'desconocido'}:`, error);
        }

        // Error P2002: Fallo de restricción única (ej. email ya existe)
        if (error.code === 'P2002') {
             return NextResponse.json({ error: 'El contacto ya existe (Unique Constraint Failed)' }, { status: 409 });
        }

        // Otros errores, incluyendo errores de conexión a DB
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
