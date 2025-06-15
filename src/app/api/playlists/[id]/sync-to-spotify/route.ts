import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SpotifyAPI } from '../../../../../lib/spotify';
import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const playlistId = params.id;
    const { action = 'sync' } = await request.json();

    // Get playlist from our database
    const playlistRef = doc(db, 'playlists', playlistId);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlistData = playlistSnap.data();

    // Check if user owns this playlist
    if (playlistData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const spotifyApi = new SpotifyAPI(accessToken);

    // If this is a new playlist (no Spotify ID), create it on Spotify
    if (!playlistData.spotifyId && action === 'create') {
      const spotifyPlaylist = await spotifyApi.createPlaylist(
        playlistData.name,
        playlistData.description
      );

      // Update our playlist with the Spotify ID
      await updateDoc(playlistRef, {
        spotifyId: spotifyPlaylist.id,
        isSpotifyPlaylist: true,
        updatedAt: serverTimestamp(),
      });

      playlistData.spotifyId = spotifyPlaylist.id;
    }

    if (!playlistData.spotifyId) {
      return NextResponse.json({ 
        error: 'Playlist is not connected to Spotify. Use action="create" to create it on Spotify first.' 
      }, { status: 400 });
    }

    // Get current tracks from Spotify playlist
    const spotifyTracks = await spotifyApi.getPlaylistTracks(playlistData.spotifyId);
    const currentSpotifyTrackUris = spotifyTracks.items.map((item: any) => item.track.uri);

    // Get desired track URIs from our database
    const desiredTrackUris = (playlistData.songs || [])
      .map((song: any) => song.uri)
      .filter((uri: string) => uri); // Only include tracks with Spotify URIs

    // Determine what needs to be added/removed
    const tracksToAdd = desiredTrackUris.filter((uri: string) => !currentSpotifyTrackUris.includes(uri));
    const tracksToRemove = currentSpotifyTrackUris.filter((uri: string) => !desiredTrackUris.includes(uri));

    // Remove tracks that are no longer in our playlist
    if (tracksToRemove.length > 0) {
      await spotifyApi.removeTracksFromPlaylist(playlistData.spotifyId, tracksToRemove);
    }

    // Add new tracks
    if (tracksToAdd.length > 0) {
      await spotifyApi.addTracksToPlaylist(playlistData.spotifyId, tracksToAdd);
    }

    // Update playlist metadata if needed
    if (action === 'sync') {
      await spotifyApi.updatePlaylist(playlistData.spotifyId, {
        name: playlistData.name,
        description: playlistData.description,
      });
    }

    // Update last sync time
    await updateDoc(playlistRef, {
      lastSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Playlist synchronized with Spotify successfully',
      playlist: {
        id: playlistId,
        name: playlistData.name,
        spotifyId: playlistData.spotifyId,
        tracksAdded: tracksToAdd.length,
        tracksRemoved: tracksToRemove.length,
      },
    });

  } catch (error) {
    console.error('Sync playlist to Spotify error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync playlist to Spotify',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
