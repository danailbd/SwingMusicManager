/**
 * Music Player Context
 * 
 * Provides global state management for the music player including:
 * - Current playing song
 * - Playback queue
 * - Player controls
 * - State persistence
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { TaggedSong } from '@/types';
import { useAppStatePersistence } from '@/lib/use-app-state-persistence';

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
  seekToTime: (timeInSeconds: number) => void;
  
  // Spotify integration
  setSpotifyPlayer: (player: any) => void;
  setIsSpotifyReady: (ready: boolean) => void;
  setSpotifyPlayerState: (state: any) => void;
  setCurrentSong: (song: TaggedSong | null) => void;
  setCurrentIndex: (index: number) => void;
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
  const {
    appState,
    isLoaded,
    updateCurrentSong: persistCurrentSong,
    updateQueue: persistQueue,
    updatePlayerVisibility: persistPlayerVisibility,
    updatePlaybackPosition: persistPlaybackPosition,
  } = useAppStatePersistence();

  const [currentSong, setCurrentSongState] = useState<TaggedSong | null>(null);
  const [queue, setQueueState] = useState<TaggedSong[]>([]);
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [isPlayerVisible, setIsPlayerVisibleState] = useState(false);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [spotifyPlayerState, setSpotifyPlayerState] = useState<any>(null);

  // Initialize state from persistence when loaded
  useEffect(() => {
    if (isLoaded && appState) {
      if (appState.currentSong) {
        setCurrentSongState(appState.currentSong);
      }
      if (appState.queue.length > 0) {
        setQueueState(appState.queue);
        setCurrentIndexState(appState.currentIndex);
      }
      setIsPlayerVisibleState(appState.isPlayerVisible);
    }
  }, [isLoaded, appState]);

  // Update persistence when local state changes
  const setCurrentSong = useCallback((song: TaggedSong | null) => {
    setCurrentSongState(song);
    persistCurrentSong(song);
  }, [persistCurrentSong]);

  const setQueue = useCallback((newQueue: TaggedSong[]) => {
    setQueueState(newQueue);
    persistQueue(newQueue, currentIndex);
  }, [persistQueue, currentIndex]);

  const setCurrentIndex = useCallback((index: number) => {
    setCurrentIndexState(index);
    persistQueue(queue, index);
  }, [persistQueue, queue]);

  const setIsPlayerVisible = useCallback((visible: boolean) => {
    setIsPlayerVisibleState(visible);
    persistPlayerVisibility(visible);
  }, [persistPlayerVisibility]);

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
  }, [isSpotifyReady, spotifyPlayer, setCurrentSong, setQueue, setCurrentIndex, setIsPlayerVisible]);

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
  }, [isSpotifyReady, spotifyPlayer, setQueue, setCurrentIndex, setCurrentSong, setIsPlayerVisible]);

  const nextSong = useCallback(async () => {
    if (queue.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    
    if (isSpotifyReady && spotifyPlayer && nextTrack?.uri) {
      // Play the next track via Spotify
      try {
        await spotifyPlayer.playTrack(nextTrack.uri);
        // Update local state
        setCurrentIndex(nextIndex);
        setCurrentSong(nextTrack);
      } catch (error) {
        console.error('Spotify next track error:', error);
        // Fallback to manual state update
        setCurrentIndex(nextIndex);
        setCurrentSong(nextTrack);
      }
    } else {
      // For preview mode, manually handle the queue
      setCurrentIndex(nextIndex);
      setCurrentSong(nextTrack);
    }
  }, [queue, currentIndex, isSpotifyReady, spotifyPlayer, setCurrentIndex, setCurrentSong]);

  const previousSong = useCallback(async () => {
    if (queue.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    const prevTrack = queue[prevIndex];
    
    if (isSpotifyReady && spotifyPlayer && prevTrack?.uri) {
      // Play the previous track via Spotify
      try {
        await spotifyPlayer.playTrack(prevTrack.uri);
        // Update local state
        setCurrentIndex(prevIndex);
        setCurrentSong(prevTrack);
      } catch (error) {
        console.error('Spotify previous track error:', error);
        // Fallback to manual state update
        setCurrentIndex(prevIndex);
        setCurrentSong(prevTrack);
      }
    } else {
      // For preview mode, manually handle the queue
      setCurrentIndex(prevIndex);
      setCurrentSong(prevTrack);
    }
  }, [queue, currentIndex, isSpotifyReady, spotifyPlayer, setCurrentIndex, setCurrentSong]);

  const skipToNextWithPreview = useCallback(() => {
    const result = findNextSongWithPreview(currentIndex, 'forward');
    if (result) {
      setCurrentIndex(result.index);
      setCurrentSong(result.song);
    }
  }, [currentIndex, findNextSongWithPreview, setCurrentIndex, setCurrentSong]);

  const skipToPreviousWithPreview = useCallback(() => {
    const result = findNextSongWithPreview(currentIndex, 'backward');
    if (result) {
      setCurrentIndex(result.index);
      setCurrentSong(result.song);
    }
  }, [currentIndex, findNextSongWithPreview, setCurrentIndex, setCurrentSong]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentSong(null);
    setCurrentIndex(0);
    setIsPlayerVisible(false);
  }, [setQueue, setCurrentSong, setCurrentIndex, setIsPlayerVisible]);

  const togglePlayer = useCallback(() => {
    setIsPlayerVisible(!isPlayerVisible);
  }, [isPlayerVisible, setIsPlayerVisible]);

  const addToQueue = useCallback((song: TaggedSong) => {
    const newQueue = [...queue, song];
    setQueue(newQueue);
  }, [queue, setQueue]);

  const removeFromQueue = useCallback((index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    
    // Adjust current index if necessary
    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
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
    
    setQueue(newQueue);
  }, [queue, currentIndex, setQueue, setCurrentIndex, setCurrentSong, setIsPlayerVisible]);

  const seekToTime = useCallback(async (timeInSeconds: number) => {
    if (isSpotifyReady && spotifyPlayer) {
      try {
        await spotifyPlayer.seek(timeInSeconds * 1000); // Spotify expects milliseconds
      } catch (error) {
        console.error('Spotify seek error:', error);
      }
    }
    // For preview mode, we can't seek, so this is primarily for Spotify
  }, [isSpotifyReady, spotifyPlayer]);

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
    seekToTime,
    
    // Spotify integration
    setSpotifyPlayer,
    setIsSpotifyReady,
    setSpotifyPlayerState,
    setCurrentSong,
    setCurrentIndex,
    spotifyPlayer,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
