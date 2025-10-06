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
    // 1. Exchange code for short-lived token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
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
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + longTokenData.expires_in);

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.facebookConnection.upsert({
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

    return NextResponse.redirect('/integrations/facebook?success=true');

  } catch (error) {
    console.error('Error en callback de Facebook:', error);
    return NextResponse.redirect('/dashboard?error=connection_failed');
  }
}