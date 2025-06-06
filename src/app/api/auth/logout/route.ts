import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies
  response.cookies.delete('spotify_access_token');
  response.cookies.delete('spotify_refresh_token');
  response.cookies.delete('user_profile');

  return response;
}
