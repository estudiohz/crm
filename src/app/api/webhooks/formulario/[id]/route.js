import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper para parsear JSON de forma segura, ahora más robusto
function safeJsonParse(data) {
    if (data === null || data === undefined || data === 'null' || data === '') {
        return [];
    }
    
    // 💡 MEJORA: Si el driver de Prisma ya devolvió un objeto o array, úsalo directamente.
    if (typeof data === 'object' && data !== null) {
        return Array.isArray(data) ? data : [];
    }
    
    // Si es una cadena (el caso que fallaba con 'tortuga' o '[object Object]')
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn(`Error al parsear JSON de DB: El valor recibido ('${data.substring(0, 50)}...') no es JSON válido.`, e);
            // Si falla el parsing, devolvemos un array vacío y el proceso continúa.
            return [];
        }
    }
    
    return [];
}

export async function POST(request, { params }) {
    let connectionId;
    let body; // Declaramos 'body' fuera del try/catch anidado

    try {
        console.log('Webhook POST request received for params:', params);
        
        // 1. Obtener y validar el ID
        connectionId = parseInt(params.id);
        if (isNaN(connectionId)) {
            return NextResponse.json({ error: 'ID de formulario no válido' }, { status: 400 });
        }
        console.log('Parsed connectionId:', connectionId);

        const contentType = request.headers.get('content-type') || '';
        console.log('Content-Type:', contentType);

        // 2. Parsear el cuerpo de la solicitud (Manejo estricto de form-data y JSON)
        if (contentType.includes('application/json')) {
            console.log('Parsing as JSON');
            try {
                body = await request.json();
            } catch (e) {
                console.warn('Body de solicitud no es JSON válido.', e);
                return NextResponse.json({ error: 'Body no es JSON válido' }, { status: 400 });
            }
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            console.log('Parsing as form-data');
            try {
                const formData = await request.formData();
                body = Object.fromEntries(formData.entries());
            } catch (e) {
                console.error('Error al leer FormData:', e);
                return NextResponse.json({ error: 'Error al procesar datos de formulario' }, { status: 400 });
            }
        } else {
            console.warn('Content-Type no compatible:', contentType);
            const textBody = await request.text();
            console.warn('Received body as text (unsupported format):', textBody.substring(0, 100) + '...');
            return NextResponse.json({ error: 'Formato de datos no compatible (Debe ser JSON o Form-Data)' }, { status: 400 });
        }
        
        console.log('Parsed body:', body);
        console.log('Webhook received for formulario:', connectionId, 'body keys:', Object.keys(body));


        // 3. Buscar el formulario (Usando método findUnique de Prisma)
        const formulario = await prisma.formulario.findUnique({
            where: { id: connectionId },
            select: {
                id: true,
                webhookSecret: true,
                mappings: true,
                etiquetas: true,
                userId: true,
            }
        });
        
        if (!formulario) {
            return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
        }
        console.log('Formulario found:', !!formulario);


        // 4. Verificar la clave secreta
        const providedSecret = body.webhook_secret;
        if (!providedSecret || providedSecret !== formulario.webhookSecret) {
            console.warn(`Intento de acceso denegado para ID: ${connectionId}. Clave inválida.`);
            return NextResponse.json({ error: 'Clave secreta de webhook inválida' }, { status: 403 });
        }
        console.log('Secret verification passed');
        
        // 5. Preparar y parsear mappings y etiquetas
        delete body.webhook_secret; // Remover la clave secreta
        console.log('Body after removing secret:', body);

        // 🚨 Llamamos a la función con el valor crudo del campo de la DB
        const mappings = safeJsonParse(formulario.mappings);
        const formularioEtiquetas = safeJsonParse(formulario.etiquetas);
        console.log('Parsed mappings count:', mappings.length);

        // 6. Mapear campos del formulario a campos de Contacto
        const contactData = {};
        mappings.forEach(mapping => {
            if (mapping.formField in body) {
                const rawValue = body[mapping.formField];
                const value = rawValue !== null && rawValue !== undefined ? rawValue.toString().trim() : '';
                contactData[mapping.contactField] = value.length > 0 ? value : null;
                console.log(`Mapped: ${mapping.formField} -> ${mapping.contactField} = ${contactData[mapping.contactField]}`);
            }
        });
        console.log('ContactData before defaults:', contactData);


        // 7. Establecer datos por defecto y etiquetas
        contactData.estado = contactData.estado || 'Activo';
        contactData.fechaCreacion = contactData.fechaCreacion || new Date();
        contactData.userId = formulario.userId;

        const formEtiquetasRaw = contactData.etiquetas;
        const formEtiquetas = safeJsonParse(formEtiquetasRaw);
        contactData.etiquetas = [...new Set([...formEtiquetas, ...formularioEtiquetas])];

        console.log('Creando contacto con datos finales:', contactData);


        // 8. Crear el Contacto (Pre-validación de campo requerido)
        // 💡 MEJORA: Comprobamos si el campo es falsy (null, undefined, "") para atraparlo antes de Prisma.
        if (!contactData.nombre) { 
            console.error("Error de Validacion: El campo 'nombre' es obligatorio y no fue provisto (es null/undefined/vacío).");
            return NextResponse.json({ error: "El campo 'nombre' es obligatorio y no fue provisto." }, { status: 400 });
        }

        const fechaCumpleanosValue = contactData.fechaCumpleanos 
            ? new Date(contactData.fechaCumpleanos) 
            : null;
        
        const etiquetasFinal = Array.isArray(contactData.etiquetas) 
            ? contactData.etiquetas 
            : [];


        const newContact = await prisma.contacto.create({
            data: {
                nombre: contactData.nombre || null,
                apellidos: contactData.apellidos || null,
                email: contactData.email || null,
                telefono: contactData.telefono || null,
                empresa: contactData.empresa || null,
                estado: contactData.estado,
                fechaCreacion: contactData.fechaCreacion,
                origen: 'Formulario',
                direccion: contactData.direccion || null,
                localidad: contactData.localidad || null,
                comunidad: contactData.comunidad || null,
                pais: contactData.pais || null,
                cp: contactData.cp || null,
                fechaCumpleanos: fechaCumpleanosValue,
                etiquetas: etiquetasFinal,
                userId: contactData.userId,
            }
        });
        console.log('Contacto created successfully, ID:', newContact.id);

        return NextResponse.json({ success: true, contactId: newContact.id }, { status: 200 });

    } catch (error) {
        console.error('Exception caught in webhook handler');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);

        const errorMessage = `Error en el Webhook para ID ${connectionId || 'desconocido'}:`;
        
        if (error.code) {
            console.error(`${errorMessage} Error de Prisma (${error.code})`, error.message);
        }

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'El contacto ya existe (Unique Constraint Failed)' }, { status: 409 });
        }
        if (error.code === 'P2011') {
            return NextResponse.json({ error: 'Datos incompletos. Un campo obligatorio no fue provisto (NOT NULL constraint failed).' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
