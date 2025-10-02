import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request) {
  try {
    const body = await request.json();
    const { cuenta, nombre, apellidos, empresa, email, telefono, imagen, estado, originalEmail } = body;

    // Find the user by original email to determine role
    const user = await prisma.user.findUnique({
      where: { email: originalEmail.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let updatedRecord;

    if (user.role === 'cuenta') {
      updatedRecord = await prisma.cuenta.update({
        where: { email: originalEmail.toLowerCase() },
        data: {
          cuenta,
          nombre,
          apellidos,
          empresa,
          email: email.toLowerCase(),
          telefono,
          imagen,
          estado,
        }
      });
    } else if (user.role === 'partner') {
      updatedRecord = await prisma.partner.update({
        where: { email: originalEmail.toLowerCase() },
        data: {
          partner: cuenta, // Assuming 'cuenta' maps to 'partner' field
          empresa,
          email: email.toLowerCase(),
          telefono,
          imagen,
          estado,
        }
      });
    } else {
      // For superadmin or other roles, perhaps update User table
      updatedRecord = await prisma.user.update({
        where: { email: originalEmail.toLowerCase() },
        data: {
          name: nombre ? `${nombre} ${apellidos || ''}`.trim() : user.name,
          email: email.toLowerCase(),
        }
      });
    }

    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Error updating profile' }, { status: 500 });
  }
}