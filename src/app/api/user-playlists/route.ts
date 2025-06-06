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
    
    // Test fetching detailed user playlists
    const playlistsResponse = await spotifyApi.getUserPlaylists();
    
    return NextResponse.json({
      success: true,
      message: 'User playlists loaded successfully',
      userId: userId,
      total: playlistsResponse.total,
      playlistCount: playlistsResponse.items?.length || 0,
      playlists: playlistsResponse.items?.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        tracks: playlist.tracks.total,
        owner: playlist.owner.display_name,
        public: playlist.public,
        images: playlist.images,
        external_urls: playlist.external_urls
      })) || [],
      rawResponse: {
        href: playlistsResponse.href,
        limit: playlistsResponse.limit,
        offset: playlistsResponse.offset,
        total: playlistsResponse.total
      }
    });

  } catch (error) {
    console.error('User playlists API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load user playlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
