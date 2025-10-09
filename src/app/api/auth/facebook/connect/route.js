import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}` +
    `&scope=pages_show_list,pages_manage_metadata,pages_manage_ads,leads_retrieval,ads_management` +
    `&response_type=code` +
    `&state=${userId}`;

  // Return the URL as JSON for popup usage
  return NextResponse.json({ authUrl: fbAuthUrl });
}