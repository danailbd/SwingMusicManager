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

    const spotifyApi = new SpotifyAPI(accessToken);
    
    // Test fetching user playlists
    const playlistsResponse = await spotifyApi.getUserPlaylists();
    
    return NextResponse.json({
      message: 'Spotify API test successful',
      userId: userId,
      playlistCount: playlistsResponse.items?.length || 0,
      playlists: playlistsResponse.items?.slice(0, 3).map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks.total,
        owner: playlist.owner.display_name
      })) || []
    });

  } catch (error) {
    console.error('Spotify API test error:', error);
    return NextResponse.json(
      { 
        error: 'Spotify API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
