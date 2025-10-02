import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Inicialización de PrismaClient
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

// 💡 NUEVO HELPER: Normaliza claves a minúsculas y quita acentos/diacríticos
function normalizeKey(key) {
    if (typeof key !== 'string') return key;

    // 1. Convertir a minúsculas
    let normalized = key.toLowerCase();
    
    // 2. Eliminar acentos/diacríticos (ej. 'Teléfono' -> 'telefono')
    // NFD normaliza la cadena y /[\u0300-\u036f]/g coincide con los acentos separados.
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return normalized;
}


export async function POST(request, { params }) {
    let connectionId;
    let body; // Declaramos 'body' fuera del try/catch anidado
    let contentType = ''; // Inicializamos contentType aquí para que esté disponible en el catch

    try {
        console.log('--- STARTING WEBHOOK HANDLER ---');
        console.log('1. Webhook POST request received for params:', params);
        
        // 1. Obtener y validar el ID
        connectionId = parseInt(params.id);
        if (isNaN(connectionId)) {
            console.error('ERROR 1.1: ID de formulario no válido. Recibido:', params.id);
            return NextResponse.json({ error: 'ID de formulario no válido' }, { status: 400 });
        }
        console.log('1.2. Parsed connectionId:', connectionId);

        contentType = request.headers.get('content-type') || '';
        console.log('1.3. Content-Type:', contentType);

        // 2. Parsear el cuerpo de la solicitud
        let rawBody;
        if (contentType.includes('application/json')) {
            // ... (lógica de parsing JSON)
            try {
                rawBody = await request.json();
            } catch (e) {
                console.warn('ERROR 2.1: Body de solicitud no es JSON válido.', e);
                return NextResponse.json({ error: 'Body no es JSON válido' }, { status: 400 });
            }
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            // ... (lógica de parsing form-data)
            try {
                const formData = await request.formData();
                rawBody = Object.fromEntries(formData.entries());
            } catch (e) {
                console.error('ERROR 2.2: Al leer FormData:', e);
                return NextResponse.json({ error: 'Error al procesar datos de formulario' }, { status: 400 });
            }
        } else {
            console.warn('ERROR 2.3: Content-Type no compatible:', contentType);
            return NextResponse.json({ error: 'Formato de datos no compatible' }, { status: 400 });
        }

        // Check for test mode
        const url = new URL(request.url);
        const mode = url.searchParams.get('mode');
        const isTestMode = mode === 'test';
        
        // 🚨 MEJORA CRÍTICA: Normalizar claves (minúsculas y sin acentos)
        body = {};
        for (const key in rawBody) {
            if (Object.prototype.hasOwnProperty.call(rawBody, key)) {
                const normalizedKey = normalizeKey(key); 
                body[normalizedKey] = rawBody[key];
            }
        }
        console.log('2.4. Parsed and normalized body keys:', Object.keys(body));
        // console.log('2.5. Full normalized body:', body); // Descomentar solo para debug extremo


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
            console.warn('ERROR 3.1: Formulario no encontrado para ID:', connectionId);
            return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
        }
        console.log('3.2. Formulario encontrado. User ID:', formulario.userId); // Nuevo Log


        // 4. Verificar la clave secreta (Acepta 'webhook' y 'webgook' en minúsculas)
        const providedSecret = body.webhook_secret || body.webgook_secret;
        if (!providedSecret || providedSecret !== formulario.webhookSecret) {
            console.warn(`ERROR 4.1: Acceso denegado para ID: ${connectionId}. Clave inválida.`);
            return NextResponse.json({ error: 'Clave secreta de webhook inválida' }, { status: 403 });
        }
        console.log('4.2. Secret verification passed.');
        
        
        // 5. Preparar y parsear mappings y etiquetas
        delete body.webhook_secret;
        delete body.webgook_secret;

        // Handle test mode
        if (isTestMode) {
            const payloadKeys = Object.keys(body);
            await prisma.formularioTestPayload.create({
                data: {
                    formularioId: connectionId,
                    payloadKeys: payloadKeys,
                }
            });
            console.log('Test mode: Payload keys saved:', payloadKeys);
            return NextResponse.json({ success: true, testMode: true }, { status: 200 });
        }

        // 🚨 Nuevo Log para verificar datos de DB
        console.log('5.1. Raw Mappings from DB:', formulario.mappings);
        console.log('5.2. Raw Etiquetas from DB:', formulario.etiquetas);

        const mappings = safeJsonParse(formulario.mappings);
        const formularioEtiquetas = safeJsonParse(formulario.etiquetas);
        console.log('5.3. Parsed mappings count:', mappings.length);

        
        // 6. Mapear campos del formulario a campos de Contacto
        const contactData = {};
        mappings.forEach(mapping => {
            // Usa el normalizador para buscar la clave en el body (ej. 'telefono')
            const formKey = normalizeKey(mapping.formField); 
            if (formKey in body) {
                const rawValue = body[formKey];
                const value = rawValue !== null && rawValue !== undefined ? rawValue.toString().trim() : '';
                contactData[mapping.contactField] = value.length > 0 ? value : null;
                console.log(`6.1. Mapped: '${mapping.formField}' (${formKey}) -> '${mapping.contactField}' = '${contactData[mapping.contactField]}'`); // Nuevo Log Detallado
            } else {
                 console.log(`6.2. Mapping skipped: Key '${mapping.formField}' (${formKey}) not found in normalized body.`); // Nuevo Log
            }
        });
        console.log('6.3. ContactData after mapping:', contactData);


        // 7. Establecer datos por defecto y etiquetas
        contactData.estado = contactData.estado || 'Activo';
        contactData.fechaCreacion = contactData.fechaCreacion || new Date();
        contactData.userId = formulario.userId;

        const formEtiquetasRaw = contactData.etiquetas;
        const formEtiquetas = safeJsonParse(formEtiquetasRaw);
        contactData.etiquetas = [...new Set([...formEtiquetas, ...formularioEtiquetas])];

        // 🚨 Nuevo Log para datos finales
        console.log('7.1. Creando contacto con datos FINALES:', contactData);


        // 8. Crear el Contacto (Pre-validación y Creación)
        if (!contactData.nombre) { 
            console.error("ERROR 8.1: Validacion: El campo 'nombre' es obligatorio y no fue provisto.");
            return NextResponse.json({ error: "El campo 'nombre' es obligatorio y no fue provisto." }, { status: 400 });
        }
        if (!contactData.userId) {
            console.error("ERROR 8.2: Validacion: El campo 'userId' es obligatorio y no fue provisto.");
            return NextResponse.json({ error: "El campo 'userId' es obligatorio (Error interno)." }, { status: 500 });
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
                origen: 'Formulario ' + formulario.nombre,
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
        console.log('--- SUCCESS 8.3: Contacto creado con éxito! ID:', newContact.id);

        // Increment leads count for the formulario
        await prisma.formulario.update({
            where: { id: connectionId },
            data: { leads: { increment: 1 } }
        });

        return NextResponse.json({ success: true, contactId: newContact.id }, { status: 200 });

    } catch (error) {
        console.error('--- EXCEPTION CAUGHT IN WEBHOOK HANDLER ---');
        const errorMessage = `Error en el Webhook para ID ${connectionId || 'desconocido'}. Content-Type: ${contentType}:`;
        
        if (error.code) {
            console.error(`${errorMessage} Error de Prisma (${error.code})`, error.message);
        } else {
            console.error(`${errorMessage} Error genérico:`, error.message);
        }
        console.error('Error stack:', error.stack);


        // P2002: Restricción Única (ej. email duplicado)
        if (error.code === 'P2002') { 
            return NextResponse.json({ error: 'El contacto ya existe (Unique Constraint Failed)' }, { status: 409 });
        }
        
        // Cualquier otro error de servidor o DB.
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
         console.log('--- ENDING WEBHOOK HANDLER ---');
    }
}
