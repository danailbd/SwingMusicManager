/**
 * Music Player Context
 * 
 * Provides global state management for the music player including:
 * - Current playing song
 * - Playback queue
 * - Player controls
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TaggedSong } from '@/types';

interface MusicPlayerContextType {
  // Player state
  currentSong: TaggedSong | null;
  queue: TaggedSong[];
  currentIndex: number;
  isPlayerVisible: boolean;
  isSpotifyReady: boolean;
  spotifyPlayerState: any;

  // Player controls
  playSong: (song: TaggedSong, playlist?: TaggedSong[]) => void;
  playPlaylist: (playlist: TaggedSong[], startIndex?: number) => void;
  nextSong: () => void;
  previousSong: () => void;
  skipToNextWithPreview: () => void;
  skipToPreviousWithPreview: () => void;
  clearQueue: () => void;
  togglePlayer: () => void;
  addToQueue: (song: TaggedSong) => void;
  removeFromQueue: (index: number) => void;
  
  // Spotify integration
  setSpotifyPlayer: (player: any) => void;
  setIsSpotifyReady: (ready: boolean) => void;
  setSpotifyPlayerState: (state: any) => void;
  setCurrentSong: (song: TaggedSong | null) => void;
  spotifyPlayer: any;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [currentSong, setCurrentSong] = useState<TaggedSong | null>(null);
  const [queue, setQueue] = useState<TaggedSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [spotifyPlayerState, setSpotifyPlayerState] = useState<any>(null);

  const playSong = useCallback(async (song: TaggedSong, playlist?: TaggedSong[]) => {
    setCurrentSong(song);
    
    if (playlist) {
      setQueue(playlist);
      const songIndex = playlist.findIndex(s => s.id === song.id);
      setCurrentIndex(songIndex >= 0 ? songIndex : 0);
    } else {
      // If no playlist provided, create a single-song queue
      setQueue([song]);
      setCurrentIndex(0);
    }
    
    setIsPlayerVisible(true);

    // Try to play on Spotify if available and song has URI
    if (isSpotifyReady && spotifyPlayer && song.uri) {
      try {
        await spotifyPlayer.playTrack(song.uri);
      } catch (error) {
        console.error('Failed to play on Spotify, falling back to preview:', error);
      }
    }
  }, [isSpotifyReady, spotifyPlayer]);

  const findNextSongWithPreview = useCallback((startIndex: number, direction: 'forward' | 'backward' = 'forward') => {
    if (queue.length === 0) return null;
    
    let currentIdx = startIndex;
    let attempts = 0;
    
    while (attempts < queue.length) {
      if (direction === 'forward') {
        currentIdx = (currentIdx + 1) % queue.length;
      } else {
        currentIdx = currentIdx === 0 ? queue.length - 1 : currentIdx - 1;
      }
      
      if (queue[currentIdx]?.previewUrl) {
        return { song: queue[currentIdx], index: currentIdx };
      }
      
      attempts++;
    }
    
    return null;
  }, [queue]);

  const playPlaylist = useCallback(async (playlist: TaggedSong[], startIndex = 0) => {
    if (playlist.length === 0) return;
    
    setQueue(playlist);
    setCurrentIndex(startIndex);
    setCurrentSong(playlist[startIndex]);
    setIsPlayerVisible(true);

    // Try to play playlist on Spotify if available
    if (isSpotifyReady && spotifyPlayer) {
      try {
        const uris = playlist.filter(song => song.uri).map(song => song.uri);
        if (uris.length > 0) {
          await spotifyPlayer.playPlaylist(uris, startIndex);
        }
      } catch (error) {
        console.error('Failed to play playlist on Spotify, falling back to preview:', error);
      }
    }
  }, [isSpotifyReady, spotifyPlayer]);

  const nextSong = useCallback(async () => {
    if (isSpotifyReady && spotifyPlayer && currentSong?.uri) {
      try {
        await spotifyPlayer.nextTrack();
      } catch (error) {
        console.error('Spotify next track error:', error);
      }
    } else if (queue.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(queue[nextIndex]);
  }, [queue, currentIndex, isSpotifyReady, spotifyPlayer, currentSong]);

  const previousSong = useCallback(async () => {
    if (isSpotifyReady && spotifyPlayer && currentSong?.uri) {
      try {
        await spotifyPlayer.previousTrack();
      } catch (error) {
        console.error('Spotify previous track error:', error);
      }
    } else if (queue.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(queue[prevIndex]);
  }, [queue, currentIndex, isSpotifyReady, spotifyPlayer, currentSong]);

  const skipToNextWithPreview = useCallback(() => {
    const result = findNextSongWithPreview(currentIndex, 'forward');
    if (result) {
      setCurrentIndex(result.index);
      setCurrentSong(result.song);
    }
  }, [currentIndex, findNextSongWithPreview]);

  const skipToPreviousWithPreview = useCallback(() => {
    const result = findNextSongWithPreview(currentIndex, 'backward');
    if (result) {
      setCurrentIndex(result.index);
      setCurrentSong(result.song);
    }
  }, [currentIndex, findNextSongWithPreview]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentSong(null);
    setCurrentIndex(0);
    setIsPlayerVisible(false);
  }, []);

  const togglePlayer = useCallback(() => {
    setIsPlayerVisible(!isPlayerVisible);
  }, [isPlayerVisible]);

  const addToQueue = useCallback((song: TaggedSong) => {
    setQueue(prevQueue => [...prevQueue, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prevQueue => {
      const newQueue = prevQueue.filter((_, i) => i !== index);
      
      // Adjust current index if necessary
      if (index < currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (index === currentIndex) {
        // If we removed the current song, play the next one or stop
        if (newQueue.length > 0) {
          const newIndex = Math.min(currentIndex, newQueue.length - 1);
          setCurrentIndex(newIndex);
          setCurrentSong(newQueue[newIndex]);
        } else {
          setCurrentSong(null);
          setCurrentIndex(0);
          setIsPlayerVisible(false);
        }
      }
      
      return newQueue;
    });
  }, [currentIndex]);

  const value: MusicPlayerContextType = {
    // State
    currentSong,
    queue,
    currentIndex,
    isPlayerVisible,
    isSpotifyReady,
    spotifyPlayerState,

    // Controls
    playSong,
    playPlaylist,
    nextSong,
    previousSong,
    skipToNextWithPreview,
    skipToPreviousWithPreview,
    clearQueue,
    togglePlayer,
    addToQueue,
    removeFromQueue,
    
    // Spotify integration
    setSpotifyPlayer,
    setIsSpotifyReady,
    setSpotifyPlayerState,
    setCurrentSong,
    spotifyPlayer,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
