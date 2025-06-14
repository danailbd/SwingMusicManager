/**
 * Music Player Component
 * 
 * Provides audio playback functionality with controls for:
 * - Play/pause toggle
 * - Progress bar with seeking
 * - Volume control
 * - Current song display
 * - Queue management
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/outline';
import { TaggedSong } from '@/types';
import { formatDuration } from '@/lib/utils';
import { useMusicPlayer } from './music-player-context';
import '../styles/music-player.css';

interface MusicPlayerProps {
  currentSong: TaggedSong | null;
  queue: TaggedSong[];
  onSongChange?: (song: TaggedSong | null) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MusicPlayer({ 
  currentSong, 
  queue, 
  onSongChange, 
  onNext, 
  onPrevious 
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isSpotifyReady, spotifyPlayer, spotifyPlayerState } = useMusicPlayer();

  // Use Spotify state when available, otherwise use local audio state
  const actualIsPlaying = isSpotifyReady && spotifyPlayerState ? spotifyPlayerState.isPlaying : isPlaying;
  const actualCurrentTime = isSpotifyReady && spotifyPlayerState ? Math.floor(spotifyPlayerState.position / 1000) : currentTime;
  const actualDuration = isSpotifyReady && spotifyPlayerState ? Math.floor(spotifyPlayerState.duration / 1000) : duration;

  // Update audio source when current song changes
  useEffect(() => {
    if (audioRef.current && currentSong?.previewUrl) {
      audioRef.current.src = currentSong.previewUrl;
      audioRef.current.load();
      setCurrentTime(0);
      setIsLoading(true);
    }
  }, [currentSong]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleLoadedData = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext) onNext();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('Audio playback error for song:', currentSong?.name);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [currentSong, onNext]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
    if (isSpotifyReady && spotifyPlayer && currentSong?.uri) {
      try {
        await spotifyPlayer.togglePlayPause();
      } catch (error) {
        console.error('Spotify playback error:', error);
      }
    } else if (audioRef.current && currentSong?.previewUrl) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      } catch (error) {
        console.error('Playback error:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    
    if (isSpotifyReady && spotifyPlayer && currentSong?.uri) {
      try {
        await spotifyPlayer.seek(newTime * 1000); // Spotify expects milliseconds
      } catch (error) {
        console.error('Spotify seek error:', error);
      }
    } else if (audioRef.current && actualDuration) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);

    if (isSpotifyReady && spotifyPlayer) {
      try {
        await spotifyPlayer.setVolume(newVolume);
      } catch (error) {
        console.error('Spotify volume error:', error);
      }
    }
  };

  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (isSpotifyReady && spotifyPlayer) {
      try {
        // For Spotify, we set volume to 0 when muted, restore previous volume when unmuted
        await spotifyPlayer.setVolume(newMutedState ? 0 : volume);
      } catch (error) {
        console.error('Spotify mute error:', error);
      }
    }
  };

  const progress = actualDuration > 0 ? (actualCurrentTime / actualDuration) * 100 : 0;

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-50">
      <audio ref={audioRef} preload="metadata" />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4">
          {/* Song Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {currentSong.imageUrl && (
              <img
                src={currentSong.imageUrl}
                alt={currentSong.album}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h4 className="text-white font-medium truncate flex items-center space-x-2">
                <span>{currentSong.name}</span>
                {isSpotifyReady && currentSong.uri && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Spotify
                  </span>
                )}
              </h4>
              <p className="text-gray-400 text-sm truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            {/* Control Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onPrevious}
                disabled={!onPrevious}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous song"
              >
                <BackwardIcon className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={!currentSong?.previewUrl && !currentSong?.uri || isLoading}
                className="p-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                title={actualIsPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : actualIsPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={onNext}
                disabled={!onNext}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next song"
              >
                <ForwardIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center space-x-2 text-xs text-gray-400">
              <span className="w-10 text-right">{formatDuration(actualCurrentTime * 1000)}</span>
              <input
                type="range"
                min="0"
                max={actualDuration}
                value={actualCurrentTime}
                onChange={handleSeek}
                className="progress-bar flex-1"
                style={{ 
                  '--progress-percentage': `${progress}%` 
                } as React.CSSProperties}
                title="Seek"
              />
              <span className="w-10">{formatDuration(actualDuration * 1000)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon className="w-5 h-5" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              style={{ 
                '--volume-percentage': `${(isMuted ? 0 : volume) * 100}%` 
              } as React.CSSProperties}
              title="Volume"
            />
          </div>
        </div>

        {/* Preview Notice */}
        {isSpotifyReady && currentSong.uri ? (
          <div className="text-center text-xs text-green-400 mt-2">
            🎵 Playing full song via Spotify • 
            <a 
              href={currentSong.spotifyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-300 hover:text-green-200 ml-1 underline"
            >
              Open in Spotify
            </a>
          </div>
        ) : currentSong.previewUrl ? (
          <div className="text-center text-xs text-gray-500 mt-2">
            Playing 30-second preview • Full song available on Spotify
          </div>
        ) : (
          <div className="text-center mt-2">
            <div className="text-xs text-yellow-500 mb-2">
              No preview available for this song • 
              <a 
                href={currentSong.spotifyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 ml-1 underline"
              >
                Play on Spotify
              </a>
            </div>
            {queue.length > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={onPrevious}
                  className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  ← Previous Song
                </button>
                <button
                  onClick={onNext}
                  className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  Next Song →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
