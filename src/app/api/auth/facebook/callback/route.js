import { NextRequest, NextResponse } from 'next/server';
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Initialize Facebook API
    const api = FacebookAdsApi.init(accessToken);

    // Get user info
    const fbUser = new api.User('me');
    const userInfo = await fbUser.get();

    // Get user pages
    const pages = await fbUser.getAccounts();

    // For each page, get page access token
    const pagesWithTokens = await Promise.all(
      pages.map(async (page) => {
        try {
          const pageObj = new api.Page(page.id);
          const pageToken = await pageObj.getAccessToken();
          return { ...page, accessToken: pageToken };
        } catch (error) {
          console.error(`Error getting token for page ${page.id}:`, error);
          return page;
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

    // Return success
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Error in Facebook callback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}