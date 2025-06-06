import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Playlist } from '../../../types';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch playlists from Firestore
    const playlistsRef = collection(db, 'playlists');
    const q = query(
      playlistsRef,
      where('userId', '==', userId)
      // Note: orderBy removed temporarily to avoid composite index requirement
      // Will be sorted in JavaScript below
    );
    
    const snapshot = await getDocs(q);
    const playlists: Playlist[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Playlist));

    // Sort playlists by createdAt in JavaScript (temporary workaround)
    playlists.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('spotify_user_id')?.value;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, description, songs } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      );
    }

    // Create playlist in Firestore
    const playlistData = {
      name: name.trim(),
      description: description?.trim() || '',
      userId,
      songs: songs || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      spotifyId: undefined // Will be set when synced to Spotify
    };

    const docRef = await addDoc(collection(db, 'playlists'), playlistData);
    
    const newPlaylist: Playlist = {
      id: docRef.id,
      ...playlistData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(newPlaylist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
