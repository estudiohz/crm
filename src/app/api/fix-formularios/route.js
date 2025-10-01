import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    console.log('Starting formulario data fix...');

    // Get all formularios
    const formularios = await prisma.$queryRaw`
      SELECT "id", "etiquetas", "mappings" FROM "Formulario"
    `;

    console.log(`Found ${formularios.length} formularios to check`);

    let fixedCount = 0;

    for (const formulario of formularios) {
      let needsUpdate = false;
      let newEtiquetas = formulario.etiquetas;
      let newMappings = formulario.mappings;

      // Fix etiquetas
      if (formulario.etiquetas !== null && typeof formulario.etiquetas === 'string') {
        try {
          // Try to parse it
          JSON.parse(formulario.etiquetas);
          // If it parses, it's already JSON string, good
        } catch (e) {
          // If it doesn't parse, it might be a raw array or something
          console.log(`Fixing etiquetas for formulario ${formulario.id}: ${formulario.etiquetas}`);
          // Assume it's a string that needs to be wrapped in array
          if (formulario.etiquetas.trim()) {
            newEtiquetas = JSON.stringify([formulario.etiquetas.trim()]);
          } else {
            newEtiquetas = JSON.stringify([]);
          }
          needsUpdate = true;
        }
      } else if (formulario.etiquetas === null) {
        newEtiquetas = JSON.stringify([]);
        needsUpdate = true;
      }

      // Fix mappings
      if (formulario.mappings !== null && typeof formulario.mappings === 'string') {
        try {
          JSON.parse(formulario.mappings);
        } catch (e) {
          console.log(`Fixing mappings for formulario ${formulario.id}: ${formulario.mappings}`);
          // For mappings, if it's invalid, set to empty array
          newMappings = JSON.stringify([]);
          needsUpdate = true;
        }
      } else if (formulario.mappings === null) {
        newMappings = JSON.stringify([]);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await prisma.$queryRaw`
          UPDATE "Formulario"
          SET "etiquetas" = ${newEtiquetas}::jsonb, "mappings" = ${newMappings}::jsonb
          WHERE "id" = ${formulario.id}
        `;
        fixedCount++;
        console.log(`Updated formulario ${formulario.id}`);
      }
    }

    console.log(`Fixed ${fixedCount} formularios`);

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} out of ${formularios.length} formularios`
    }, { status: 200 });

  } catch (error) {
    console.error('Error fixing formularios:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}