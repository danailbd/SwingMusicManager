import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Middleware function to validate Spotify authentication
 * Use this in API routes that need authentication
 */
export async function validateSpotifyAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const userId = cookieStore.get('spotify_user_id')?.value;

  if (!accessToken || !userId) {
    return {
      isValid: false,
      error: NextResponse.json({ error: 'Not authenticated with Spotify' }, { status: 401 }),
      accessToken: null,
      userId: null
    };
  }

  // Optionally verify the token with Spotify API
  try {
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!spotifyResponse.ok) {
      return {
        isValid: false,
        error: NextResponse.json({ error: 'Invalid Spotify token' }, { status: 401 }),
        accessToken: null,
        userId: null
      };
    }

    return {
      isValid: true,
      error: null,
      accessToken,
      userId
    };
  } catch (error) {
    return {
      isValid: false,
      error: NextResponse.json({ error: 'Failed to validate Spotify token' }, { status: 401 }),
      accessToken: null,
      userId: null
    };
  }
}
