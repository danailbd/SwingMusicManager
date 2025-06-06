import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function GET(
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

    const playlist = {
      id: playlistSnap.id,
      ...playlistData
    };

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { name, description, songs } = await request.json();
    
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

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (songs !== undefined) updateData.songs = songs;

    await updateDoc(playlistRef, updateData);

    const updatedPlaylist = {
      id: id,
      ...playlistData,
      ...updateData,
      updatedAt: new Date()
    };

    return NextResponse.json(updatedPlaylist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await deleteDoc(playlistRef);

    return NextResponse.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
