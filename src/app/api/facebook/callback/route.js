import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId

  if (!code || !state) {
    return NextResponse.redirect('/dashboard?error=auth_failed');
  }

  try {
    console.log('Facebook callback: Starting token exchange');

    // Check environment variables
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.FACEBOOK_REDIRECT_URI) {
      console.error('Facebook callback: Missing environment variables');
      throw new Error('Missing Facebook configuration');
    }

    // 1. Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}` +
      `&code=${code}`;

    console.log('Facebook callback: Fetching token from:', tokenUrl.replace(/client_secret=[^&]+/, 'client_secret=***'));

    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      console.error('Facebook callback: Token response not ok:', tokenResponse.status, tokenResponse.statusText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Facebook callback: Token data received');

    if (!tokenData.access_token) {
      console.error('Facebook callback: No access_token in response:', tokenData);
      throw new Error('No se obtuvo access_token');
    }

    // 2. Get long-lived token
    const longTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );

    const longTokenData = await longTokenResponse.json();

    // 3. Get Facebook user info
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${longTokenData.access_token}`
    );
    const fbUserInfo = await userInfoResponse.json();

    // 4. Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longTokenData.access_token}`
    );
    const pagesData = await pagesResponse.json();

    // Save connection to database
    console.log('Facebook callback: Saving connection to database');
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + longTokenData.expires_in);

    try {
      const connection = await prisma.facebookConnection.upsert({
        where: { userId: state },
        update: {
          facebookUserId: fbUserInfo.id,
          accessToken: longTokenData.access_token,
          tokenExpiresAt: expiresAt,
          pagesData: pagesData.data
        },
        create: {
          userId: state,
          facebookUserId: fbUserInfo.id,
          accessToken: longTokenData.access_token,
          tokenExpiresAt: expiresAt,
          pagesData: pagesData.data
        },
      });
      console.log('Facebook callback: Connection saved successfully:', connection.id);
    } catch (dbError) {
      console.error('Facebook callback: Database error:', dbError);
      throw dbError;
    }

    console.log('Facebook callback: Redirecting to success page');
    return NextResponse.redirect('/integrations/facebook?success=true');

  } catch (error) {
    console.error('Error en callback de Facebook:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);

    // Log additional context
    console.error('Request params:', { code: code ? 'present' : 'missing', state });

    return NextResponse.redirect('/dashboard?error=connection_failed');
  }
}