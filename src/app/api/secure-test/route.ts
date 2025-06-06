import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateSpotifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Validate authentication first
  const authResult = await validateSpotifyAuth(request);
  if (!authResult.isValid) {
    return authResult.error;
  }

  try {
    const { name, description, tags = [] } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const playlistData = {
      id: playlistId,
      name,
      description: description || '',
      tags,
      userId: authResult.userId, // Use validated user ID
      songs: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      spotifyId: null, // Will be set when synced to Spotify
      isPublic: false
    };

    await setDoc(doc(db, 'playlists', playlistId), playlistData);

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlistData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ 
      error: 'Failed to create playlist',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Validate authentication first
  const authResult = await validateSpotifyAuth(request);
  if (!authResult.isValid) {
    return authResult.error;
  }

  try {
    // This would typically fetch playlists for the authenticated user
    // For now, return a success response indicating the auth works
    return NextResponse.json({
      success: true,
      message: 'Authentication validated successfully',
      userId: authResult.userId,
      playlists: [] // Would fetch actual playlists here
    });
  } catch (error: any) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch playlists',
      details: error.message 
    }, { status: 500 });
  }
}
