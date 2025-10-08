import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId

  if (!code || !state) {
    return NextResponse.redirect(`${new URL(request.url).origin}/facebook/callback?status=error&message=Faltan%20par%C3%A1metros%3A%20code%20o%20state`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${new URL(request.url).origin}/facebook/callback?status=error&message=${encodeURIComponent(tokenData.error.message)}`);
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`);
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    const userInfo = await userResponse.json();

    // Get user pages
    const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
    if (!pagesResponse.ok) {
      throw new Error('Failed to get pages');
    }
    const pagesData = await pagesResponse.json();
    const pages = pagesData.data;

    // For each page, get page access token using fetch
    const pagesWithTokens = await Promise.all(
      pages.map(async (page) => {
        try {
          const tokenResponse = await fetch(`https://graph.facebook.com/${page.id}?fields=access_token&access_token=${accessToken}`);
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            return { ...page, accessToken: tokenData.access_token };
          } else {
            console.error(`Error getting token for page ${page.id}`);
            return { ...page, accessToken: accessToken }; // fallback
          }
        } catch (error) {
          console.error(`Error getting token for page ${page.id}:`, error);
          return { ...page, accessToken: accessToken }; // fallback
        }
      })
    );

    // Calculate expires at
    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;

    // Save connection with page tokens
    await prisma.facebookConnection.upsert({
      where: { crmUserId: state },
      update: {
        userAccessToken: accessToken,
        userTokenExpiresAt: expiresAt,
        pagesData: pagesWithTokens,
        updatedAt: new Date(),
      },
      create: {
        crmUserId: state,
        facebookUserId: userInfo.id,
        userAccessToken: accessToken,
        userTokenExpiresAt: expiresAt,
        pagesData: pagesWithTokens,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(`${new URL(request.url).origin}/facebook/callback?status=success`);
  } catch (error) {
    console.error('Error in Facebook callback:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/facebook/callback?status=error&message=${encodeURIComponent(error.message)}`);
  }
}