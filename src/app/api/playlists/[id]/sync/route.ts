import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { SpotifyAPI } from '../../../../../lib/spotify';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const playlistRef = doc(db, 'playlists', id);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlistData = playlistSnap.data();
    
    // Check if user owns this playlist
    if (playlistData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const spotify = new SpotifyApi(accessToken);
    
    let spotifyPlaylistId = playlistData.spotifyId;
    
    // Create or update Spotify playlist
    if (!spotifyPlaylistId) {
      // Create new playlist on Spotify
      const spotifyPlaylist = await spotify.createPlaylist(userId, {
        name: playlistData.name,
        description: playlistData.description || 'Created with Song Tagger',
        public: false
      });
      spotifyPlaylistId = spotifyPlaylist.id;
    } else {
      // Update existing playlist details
      await spotify.updatePlaylist(spotifyPlaylistId, {
        name: playlistData.name,
        description: playlistData.description || 'Created with Song Tagger'
      });
    }

    // Add tracks to Spotify playlist
    const songs = playlistData.songs || [];
    if (songs.length > 0) {
      const trackUris = songs
        .filter((song: any) => song.spotifyId)
        .map((song: any) => `spotify:track:${song.spotifyId}`);
      
      if (trackUris.length > 0) {
        // Replace all tracks in the playlist
        await spotify.replacePlaylistTracks(spotifyPlaylistId, trackUris);
      }
    }

    // Update playlist in Firestore with Spotify ID
    await updateDoc(playlistRef, {
      spotifyId: spotifyPlaylistId,
      lastSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const updatedPlaylist = {
      id: id,
      ...playlistData,
      spotifyId: spotifyPlaylistId,
      lastSyncedAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({
      playlist: updatedPlaylist,
      message: 'Playlist synced to Spotify successfully',
      spotifyUrl: `https://open.spotify.com/playlist/${spotifyPlaylistId}`
    });
  } catch (error) {
    console.error('Error syncing playlist to Spotify:', error);
    
    // Handle specific Spotify API errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid access token')) {
        return NextResponse.json(
          { error: 'Spotify access token expired. Please reconnect.' },
          { status: 401 }
        );
      }
      if (error.message.includes('Insufficient client scope')) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Please reconnect to Spotify.' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to sync playlist to Spotify' },
      { status: 500 }
    );
  }
}
