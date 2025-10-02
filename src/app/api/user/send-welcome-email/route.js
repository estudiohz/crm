import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { emailSettings, recipientEmail, userEmail, password, type } = await request.json();

    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPass) {
      return NextResponse.json({ message: 'Servidor no configurado' }, { status: 400 });
    }

    // Use app password for Gmail if provided
    const pass = (emailSettings.provider === 'gmail' && emailSettings.appPassword) ? emailSettings.appPassword : emailSettings.smtpPass;

    // Configure transporter based on authType
    let transporterConfig = {
      host: emailSettings.smtpHost,
      port: parseInt(emailSettings.smtpPort),
      auth: {
        user: emailSettings.smtpUser,
        pass: pass,
      },
    };

    if (emailSettings.authType === 'tls') {
      transporterConfig.secure = true;
    } else if (emailSettings.authType === 'starttls') {
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
    } else {
      // ninguna
      transporterConfig.secure = false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    const subject = `Se ha creado tu cuenta de ${type === 'cuenta' ? 'Cliente' : 'Partner'}. Bienvenid@`;
    const message = `Te damos la bienvenida a nuestro sistema de CRM personal

Aquí tienes los detalles de acceso:

Login: https://crm-panel.g0ncz4.easypanel.host/
User: ${userEmail}
Password: ${password}

Te esperamos`;

    // Send email
    const info = await transporter.sendMail({
      from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
      to: recipientEmail,
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    });

    return NextResponse.json({ message: 'Email de bienvenida enviado exitosamente', info }, { status: 200 });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ message: 'Error al enviar email de bienvenida: ' + error.message }, { status: 500 });
  }
}