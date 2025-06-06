import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Test token validity by calling Spotify's /me endpoint
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({
        success: false,
        tokenValid: false,
        error: `Token invalid: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }

    const userData = await response.json();

    // Also test the recently played endpoint specifically
    const recentResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const recentData = recentResponse.ok ? await recentResponse.json() : null;
    const recentError = !recentResponse.ok ? await recentResponse.text() : null;

    return NextResponse.json({
      success: true,
      tokenValid: true,
      user: {
        id: userData.id,
        display_name: userData.display_name,
        country: userData.country,
      },
      recentlyPlayedTest: {
        success: recentResponse.ok,
        status: recentResponse.status,
        hasData: !!recentData?.items?.length,
        itemCount: recentData?.items?.length || 0,
        error: recentError
      }
    });

  } catch (error: any) {
    console.error('Token test error:', error);
    return NextResponse.json(
      { error: 'Failed to test token', details: error.message },
      { status: 500 }
    );
  }
}
