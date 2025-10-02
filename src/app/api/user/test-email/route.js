import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName, testEmail, authType, provider, appPassword } = await request.json();

    // Use app password for Gmail if provided
    const password = (provider === 'gmail' && appPassword) ? appPassword : smtpPass;

    // Configure transporter based on authType
    let transporterConfig = {
      host: smtpHost,
      port: parseInt(smtpPort),
      auth: {
        user: smtpUser,
        pass: password,
      },
    };

    if (authType === 'tls') {
      transporterConfig.secure = true;
    } else if (authType === 'starttls') {
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
    } else {
      // ninguna
      transporterConfig.secure = false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: testEmail,
      subject: 'Test Email from CRM App',
      text: 'This is a test email to verify your SMTP configuration.',
      html: '<p>This is a test email to verify your SMTP configuration.</p>',
    });

    return NextResponse.json({ message: 'Test email sent successfully', info }, { status: 200 });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ message: 'Error sending test email: ' + error.message }, { status: 500 });
  }
}