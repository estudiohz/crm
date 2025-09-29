// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();
    console.log('Login attempt for email:', email);

    // 1. Buscar al usuario por email
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    console.log('User found:', !!user);

    // 2. Si no se encuentra el usuario, devolver un error
    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 3. Comparar la contraseña ingresada con la encriptada
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);

    // 4. Si la contraseña no coincide, devolver un error
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 5. Si el rol es 'cliente', obtener los datos del cliente
    // Si el rol es 'partner', obtener los datos del partner
    let clienteData = null;
    let partnerData = null;
    if (user.role === 'cliente') {
      clienteData = await prisma.cliente.findFirst({
        where: { email: user.email },
      });
    } else if (user.role === 'partner') {
      partnerData = await prisma.partner.findFirst({
        where: { email: user.email },
      });
    }

    // 6. Si todo es correcto, devolver una respuesta exitosa
    // En un proyecto real, aquí devolverías un token JWT
    return NextResponse.json({
      message: 'Inicio de sesión exitoso.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        cliente: clienteData,
        partner: partnerData,
      },
    });

  } catch (error) {
    console.error('Error en el login:', error);
    return NextResponse.json({ message: 'Error en el servidor.' }, { status: 500 });
  }
}