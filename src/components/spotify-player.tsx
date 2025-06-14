/**
 * Spotify Web Playback SDK Integration
 * 
 * Enables full song playback through the user's Spotify account
 * Requires Spotify Premium subscription
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useMusicPlayer } from './music-player-context';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback?: (data: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  getVolume: () => Promise<number>;
  nextTrack: () => Promise<void>;
  pause: () => Promise<void>;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

interface SpotifyPlaybackState {
  context: {
    uri: string;
    metadata: any;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ name: string; uri: string }>;
  album: {
    name: string;
    uri: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

interface SpotifyPlayerProps {
  accessToken: string | null;
}

export function SpotifyPlayer({ accessToken }: SpotifyPlayerProps) {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const { currentSong, setSpotifyPlayer, setIsSpotifyReady, setSpotifyPlayerState, setCurrentSong } = useMusicPlayer();

  // Function to update current song from Spotify track data
  const updateCurrentSongFromSpotify = useCallback((spotifyTrack: SpotifyTrack) => {
    // Only update if this is a different track
    if (currentSong?.spotifyId === spotifyTrack.id) return;

    // Convert Spotify track to TaggedSong format
    const taggedSong = {
      id: spotifyTrack.id,
      spotifyId: spotifyTrack.id,
      name: spotifyTrack.name,
      artist: spotifyTrack.artists.map(artist => artist.name).join(', '),
      album: spotifyTrack.album.name,
      imageUrl: spotifyTrack.album.images[0]?.url || '',
      duration: spotifyTrack.duration_ms,
      previewUrl: null, // Spotify Web Playback doesn't use previews
      spotifyUrl: `https://open.spotify.com/track/${spotifyTrack.id}`,
      uri: spotifyTrack.uri,
      userId: '', // Will be set by context
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentSong(taggedSong);
  }, [currentSong, setCurrentSong]);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Song Tagger Player',
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      setPlayer(spotifyPlayer);

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player Ready with Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setIsPremium(true);
        setIsSpotifyReady(true);
        setSpotifyPlayer(spotifyPlayer);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify Player Device ID has gone offline:', device_id);
        setIsReady(false);
        setIsSpotifyReady(false);
      });

      // Initialization Error
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Spotify Player initialization error:', message);
        setIsPremium(false);
      });

      // Authentication Error
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Spotify Player authentication error:', message);
        setIsPremium(false);
      });

      // Account Error (usually means no Premium)
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Spotify Player account error:', message);
        setIsPremium(false);
      });

      // Playback Error
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Spotify Player playback error:', message);
      });

      // Player State Changed
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;
        console.log('Spotify Player state changed:', state);
        
        // Update music player context with current state
        setSpotifyPlayerState({
          isPlaying: !state.paused,
          position: state.position,
          duration: state.track_window.current_track.duration_ms,
          currentTrack: state.track_window.current_track,
        });

        // Update current song if track changed
        const currentTrack = state.track_window.current_track;
        if (currentTrack) {
          updateCurrentSongFromSpotify(currentTrack);
        }
      });

      // Connect to the player
      spotifyPlayer.connect().then((success) => {
        if (success) {
          console.log('Successfully connected to Spotify Player');
        } else {
          console.error('Failed to connect to Spotify Player');
        }
      });
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  // Function to play a track on Spotify
  const playTrackOnSpotify = useCallback(async (trackUri: string) => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [trackUri],
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to play track on Spotify:', errorData);
        throw new Error(errorData.error?.message || 'Failed to play track');
      }

      console.log('Successfully started playback on Spotify');
    } catch (error) {
      console.error('Error playing track on Spotify:', error);
      throw error;
    }
  }, [accessToken, deviceId]);

  // Function to play a playlist on Spotify
  const playPlaylistOnSpotify = useCallback(async (trackUris: string[], startIndex = 0) => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: trackUris,
          offset: { position: startIndex },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to play playlist on Spotify:', errorData);
        throw new Error(errorData.error?.message || 'Failed to play playlist');
      }

      console.log('Successfully started playlist playback on Spotify');
    } catch (error) {
      console.error('Error playing playlist on Spotify:', error);
      throw error;
    }
  }, [accessToken, deviceId]);

  // Real-time position updates for Spotify player
  useEffect(() => {
    if (!isReady || !player) return;

    const updateInterval = setInterval(async () => {
      try {
        const state = await player.getCurrentState();
        if (state && !state.paused) {
          setSpotifyPlayerState({
            isPlaying: !state.paused,
            position: state.position,
            duration: state.track_window.current_track.duration_ms,
            currentTrack: state.track_window.current_track,
          });
        }
      } catch (error) {
        console.error('Error getting Spotify player state:', error);
      }
    }, 1000); // Update every second

    return () => clearInterval(updateInterval);
  }, [isReady, player, setSpotifyPlayerState]);
  useEffect(() => {
    if (isReady && player) {
      setSpotifyPlayer({
        ...player,
        playTrack: playTrackOnSpotify,
        playPlaylist: playPlaylistOnSpotify,
        deviceId,
        // Direct player controls
        togglePlayPause: () => player.togglePlay(),
        nextTrack: () => player.nextTrack(),
        previousTrack: () => player.previousTrack(),
        seek: (position: number) => player.seek(position),
        setVolume: (volume: number) => player.setVolume(volume),
        getCurrentState: () => player.getCurrentState(),
      });
    }
  }, [isReady, player, playTrackOnSpotify, playPlaylistOnSpotify, deviceId, setSpotifyPlayer]);

  // Render status UI
  if (!accessToken) {
    return null;
  }

  if (isPremium === false) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-w-sm z-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-yellow-400 font-semibold text-sm">Spotify Premium Required</h3>
            <p className="text-yellow-300 text-xs mt-1">
              Full song playback requires a Spotify Premium subscription. You can still use 30-second previews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="fixed top-4 right-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-medium">Spotify Player Ready</span>
        </div>
      </div>
    );
  }

  return null;
}
