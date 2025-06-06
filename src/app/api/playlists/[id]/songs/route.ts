import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';

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

    const { songs } = await request.json();

    if (!songs || !Array.isArray(songs)) {
      return NextResponse.json(
        { error: 'Songs array is required' },
        { status: 400 }
      );
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

    const existingSongs = playlistData.songs || [];
    const existingSongIds = new Set(existingSongs.map((song: any) => song.id));
    
    // Filter out songs that are already in the playlist
    const newSongs = songs.filter(song => !existingSongIds.has(song.id));
    
    if (newSongs.length === 0) {
      return NextResponse.json(
        { message: 'All songs are already in the playlist' },
        { status: 200 }
      );
    }

    const updatedSongs = [...existingSongs, ...newSongs];

    await updateDoc(playlistRef, {
      songs: updatedSongs,
      updatedAt: serverTimestamp()
    });

    const updatedPlaylist = {
      id: id,
      ...playlistData,
      songs: updatedSongs,
      updatedAt: new Date()
    };

    return NextResponse.json({
      playlist: updatedPlaylist,
      message: `Added ${newSongs.length} song${newSongs.length > 1 ? 's' : ''} to playlist`
    });
  } catch (error) {
    console.error('Error adding songs to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add songs to playlist' },
      { status: 500 }
    );
  }
}
