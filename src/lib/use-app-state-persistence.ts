/**
 * App State Persistence Hook
 * 
 * Manages persistence of app state including:
 * - Active navigation tab/view
 * - Current playing song and queue
 * - Player state and position
 * - User preferences
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { TaggedSong } from '@/types';

export type ActiveView = 'search' | 'library' | 'tags' | 'playlists' | 'recent';

interface AppState {
  // Navigation state
  activeView: ActiveView;
  searchQuery: string;
  
  // Music player state
  currentSong: TaggedSong | null;
  queue: TaggedSong[];
  currentIndex: number;
  isPlayerVisible: boolean;
  playbackPosition: number; // in seconds
  
  // Playlist state
  selectedPlaylistId: string | null;
  
  // User preferences
  volume: number;
  autoplay: boolean;
  
  // Timestamps
  lastUpdated: number;
  sessionId: string;
}

const DEFAULT_APP_STATE: AppState = {
  activeView: 'search',
  searchQuery: '',
  currentSong: null,
  queue: [],
  currentIndex: 0,
  isPlayerVisible: false,
  playbackPosition: 0,
  selectedPlaylistId: null,
  volume: 0.8,
  autoplay: true,
  lastUpdated: Date.now(),
  sessionId: generateSessionId(),
};

const STORAGE_KEY = 'song-tagger-app-state';
const MAX_STATE_AGE = 24 * 60 * 60 * 1000; // 24 hours

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAppStatePersistence() {
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadState = () => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState: AppState = JSON.parse(savedState);
          
          // Check if state is not too old
          const age = Date.now() - parsedState.lastUpdated;
          if (age < MAX_STATE_AGE) {
            // Update session ID but keep other state
            setAppState({
              ...parsedState,
              sessionId: generateSessionId(),
              lastUpdated: Date.now(),
            });
          } else {
            // State is too old, use defaults but keep some preferences
            setAppState({
              ...DEFAULT_APP_STATE,
              volume: parsedState.volume || DEFAULT_APP_STATE.volume,
              autoplay: parsedState.autoplay ?? DEFAULT_APP_STATE.autoplay,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load app state:', error);
        setAppState(DEFAULT_APP_STATE);
      } finally {
        setIsLoaded(true);
      }
    };

    loadState();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial state is loaded
    
    const saveState = () => {
      try {
        const stateToSave = {
          ...appState,
          lastUpdated: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Failed to save app state:', error);
      }
    };

    // Debounce saves to avoid excessive localStorage writes
    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [appState, isLoaded]);

  // Update navigation state
  const updateActiveView = useCallback((view: ActiveView) => {
    setAppState(prev => ({ ...prev, activeView: view }));
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setAppState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Update music player state
  const updateCurrentSong = useCallback((song: TaggedSong | null) => {
    setAppState(prev => ({ 
      ...prev, 
      currentSong: song,
      playbackPosition: 0, // Reset position when song changes
    }));
  }, []);

  const updateQueue = useCallback((queue: TaggedSong[], index: number = 0) => {
    setAppState(prev => ({ 
      ...prev, 
      queue, 
      currentIndex: index,
    }));
  }, []);

  const updatePlayerVisibility = useCallback((visible: boolean) => {
    setAppState(prev => ({ ...prev, isPlayerVisible: visible }));
  }, []);

  const updatePlaybackPosition = useCallback((position: number) => {
    setAppState(prev => ({ ...prev, playbackPosition: position }));
  }, []);

  // Update playlist state
  const updateSelectedPlaylist = useCallback((playlistId: string | null) => {
    setAppState(prev => ({ ...prev, selectedPlaylistId: playlistId }));
  }, []);

  // Update user preferences
  const updateVolume = useCallback((volume: number) => {
    setAppState(prev => ({ ...prev, volume }));
  }, []);

  const updateAutoplay = useCallback((autoplay: boolean) => {
    setAppState(prev => ({ ...prev, autoplay }));
  }, []);

  // Clear state (for logout, etc.)
  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAppState(DEFAULT_APP_STATE);
  }, []);

  // Get state snapshot for debugging
  const getStateSnapshot = useCallback(() => {
    return {
      ...appState,
      age: Date.now() - appState.lastUpdated,
      isValid: (Date.now() - appState.lastUpdated) < MAX_STATE_AGE,
    };
  }, [appState]);

  return {
    // State
    appState,
    isLoaded,
    
    // Navigation
    updateActiveView,
    updateSearchQuery,
    
    // Music Player
    updateCurrentSong,
    updateQueue,
    updatePlayerVisibility,
    updatePlaybackPosition,
    
    // Playlist
    updateSelectedPlaylist,
    
    // Preferences
    updateVolume,
    updateAutoplay,
    
    // Utility
    clearState,
    getStateSnapshot,
  };
}
