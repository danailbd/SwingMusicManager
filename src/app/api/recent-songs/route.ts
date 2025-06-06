import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SpotifyAPI } from '../../../lib/spotify';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fetching recent songs for user:', userId);
    const spotify = new SpotifyAPI(accessToken);
    
    // Get recently played tracks from Spotify
    const recentTracksResponse = await spotify.getRecentlyPlayedTracks(50);
    console.log('Spotify API response:', { 
      hasItems: !!recentTracksResponse.items, 
      itemCount: recentTracksResponse.items?.length || 0 
    });
    
    // Transform the data to match our expected format
    const recentTracks = recentTracksResponse.items?.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists,
      album: item.track.album,
      duration_ms: item.track.duration_ms,
      preview_url: item.track.preview_url,
      external_urls: item.track.external_urls,
      uri: item.track.uri,
      played_at: item.played_at,
    })) || [];

    return NextResponse.json({
      success: true,
      tracks: recentTracks,
      total: recentTracks.length,
    });
  } catch (error: any) {
    console.error('Error fetching recent songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent songs', details: error.message },
      { status: 500 }
    );
  }
}
