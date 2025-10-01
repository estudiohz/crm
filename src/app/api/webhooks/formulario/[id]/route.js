import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper para parsear JSON de forma segura
function safeJsonParse(jsonString) {
    if (!jsonString || jsonString === 'null' || jsonString === '') {
        return [];
    }
    try {
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
        // 1. Obtener y validar el ID
        connectionId = parseInt(params.id);
        if (isNaN(connectionId)) {
            return NextResponse.json({ error: 'ID de formulario no válido' }, { status: 400 });
        }

        let body;
        const contentType = request.headers.get('content-type');
        
        // 2. Parsear el cuerpo de la solicitud (Mejor manejo de form-data)
        if (contentType && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data'))) {
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        } else {
            // Asume JSON si no es form-data, o usa fallback
            try {
                body = await request.json(); 
            } catch (e) {
                 // Si no puede parsear como JSON, el body es irreconocible.
                 console.warn('Body de solicitud no es JSON válido.', e);
                 return NextResponse.json({ error: 'Formato de datos no compatible' }, { status: 400 });
            }
        }

        console.log('Webhook received for formulario:', connectionId, 'body:', body);

        // 3. Buscar el formulario (Usando método findUnique de Prisma)
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

        if (!formulario) {
            return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
        }

        // 4. Verificar la clave secreta
        const providedSecret = body.webhook_secret;
        if (!providedSecret || providedSecret !== formulario.webhookSecret) {
            console.warn(`Intento de acceso denegado para ID: ${connectionId}. Clave inválida.`);
            return NextResponse.json({ error: 'Clave secreta de webhook inválida' }, { status: 403 });
        }
        
        // 5. Preparar y parsear mappings y etiquetas
        delete body.webhook_secret; // Remover la clave secreta del cuerpo del contacto
        
        // Asumiendo que Prisma devuelve los campos JSONB como strings, los parseamos.
        // Si tu configuración de Prisma ya los devuelve como objetos, puedes omitir el safeJsonParse.
        const mappings = safeJsonParse(formulario.mappings);
        const formularioEtiquetas = safeJsonParse(formulario.etiquetas);


        // 6. Mapear campos del formulario a campos de Contacto
        const contactData = {};
        mappings.forEach(mapping => {
            if (body[mapping.formField]) {
                contactData[mapping.contactField] = body[mapping.formField];
            }
        });

        // 7. Establecer datos por defecto y etiquetas
        contactData.estado = contactData.estado || 'Activo';
        contactData.fechaCreacion = new Date();
        contactData.userId = formulario.userId;

        // Combina etiquetas del formulario (si existen) con las etiquetas del formulario en DB
        const formEtiquetas = contactData.etiquetas || [];
        // Asegúrate de que las etiquetas sean un array antes de combinarlas
        contactData.etiquetas = [...new Set([...formEtiquetas, ...formularioEtiquetas])];

        console.log('Creando contacto con datos:', contactData);

        // 8. Crear el Contacto (Usando método create de Prisma)
        const newContact = await prisma.contacto.create({
            data: {
                // Mapeo directo de campos de Contacto.
                // Asegúrate de que 'etiquetas' sea un campo JSONB en tu esquema.
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
                etiquetas: contactData.etiquetas, // Prisma maneja el JSON/JSONB
                userId: contactData.userId,
                // createdAt y updatedAt son manejados por el @default(now()) y @updatedAt
            }
        });

        console.log('Contacto creado:', newContact);

        return NextResponse.json({ success: true, contactId: newContact.id }, { status: 200 });

    } catch (error) {
        console.error(`Error en el Webhook para ID ${connectionId || 'desconocido'}:`, error);
        
        // Si el error es de Prisma (P2002: unique constraint failed), puedes devolver un 409 Conflict
        // if (error.code === 'P2002') { 
        //     return NextResponse.json({ error: 'El email ya existe' }, { status: 409 });
        // }

        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
