import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SpotifyAPI } from '../../../../lib/spotify';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { spotifyPlaylistId } = await request.json();

    if (!spotifyPlaylistId) {
      return NextResponse.json({ error: 'Spotify playlist ID is required' }, { status: 400 });
    }

    const spotifyApi = new SpotifyAPI(accessToken);

    // Get playlist details from Spotify
    const spotifyPlaylist = await spotifyApi.getPlaylist(spotifyPlaylistId);

    // Get playlist tracks from Spotify
    const tracksData = await spotifyApi.getPlaylistTracks(spotifyPlaylistId);

    // Check if playlist already exists in our database
    const playlistsRef = collection(db, 'playlists');
    const existingQuery = query(
      playlistsRef,
      where('spotifyId', '==', spotifyPlaylistId),
      where('userId', '==', userId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Playlist already imported',
        playlistId: existingSnapshot.docs[0].id 
      }, { status: 409 });
    }

    // Import tracks first
    const songs = [];
    for (const item of tracksData.items) {
      if (item.track && item.track.id) {
        try {
          // Check if song already exists in our database
          const songsRef = collection(db, 'songs');
          const songQuery = query(songsRef, where('spotifyId', '==', item.track.id));
          const songSnapshot = await getDocs(songQuery);

          let songId;
          if (songSnapshot.empty) {
            // Create new song
            const songDocRef = await addDoc(songsRef, {
              name: item.track.name,
              artist: item.track.artists[0]?.name || 'Unknown Artist',
              album: item.track.album?.name || 'Unknown Album',
              duration: item.track.duration_ms,
              spotifyId: item.track.id,
              uri: item.track.uri,
              previewUrl: item.track.preview_url,
              imageUrl: item.track.album?.images?.[0]?.url || '',
              spotifyUrl: item.track.external_urls?.spotify || '',
              userId: userId,
              tags: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            songId = songDocRef.id;
          } else {
            songId = songSnapshot.docs[0].id;
          }

          songs.push({
            id: songId,
            spotifyId: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name || 'Unknown Artist',
            album: item.track.album?.name || 'Unknown Album',
            duration: item.track.duration_ms,
            uri: item.track.uri,
            previewUrl: item.track.preview_url,
            imageUrl: item.track.album?.images?.[0]?.url || '',
            spotifyUrl: item.track.external_urls?.spotify || '',
            userId: userId,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (error) {
          console.error(`Failed to import track ${item.track.id}:`, error);
          // Continue with other tracks
        }
      }
    }

    // Create playlist in our database
    const playlistDocRef = await addDoc(playlistsRef, {
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description || '',
      userId: userId,
      spotifyId: spotifyPlaylistId,
      isSpotifyPlaylist: true,
      songs: songs,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Spotify playlist imported successfully',
      playlist: {
        id: playlistDocRef.id,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description,
        spotifyId: spotifyPlaylistId,
        songsCount: songs.length,
      },
    });

  } catch (error) {
    console.error('Import Spotify playlist error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import Spotify playlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
