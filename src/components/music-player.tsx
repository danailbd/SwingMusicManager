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
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  BookmarkIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { TaggedSong, SongBookmark } from '@/types';
import { formatDuration } from '@/lib/utils';
import { useMusicPlayer } from './music-player-context';
import { 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  
  // Bookmark creation modal state
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');
  const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
  const [bookmarkFeedback, setBookmarkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const { isSpotifyReady, spotifyPlayer, spotifyPlayerState, currentSongBookmarks, seekToTime } = useMusicPlayer();

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

  // Bookmark creation functions
  const handleCreateBookmark = () => {
    if (!currentSong) return;
    setShowBookmarkModal(true);
    // Auto-generate a label based on current time
    const minutes = Math.floor(actualCurrentTime / 60);
    const seconds = Math.floor(actualCurrentTime % 60);
    setBookmarkLabel(`Bookmark at ${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  const handleSaveBookmark = async () => {
    if (!currentSong || !bookmarkLabel.trim()) return;
    
    setIsCreatingBookmark(true);
    try {
      const bookmarkData: any = {
        songId: currentSong.spotifyId,
        userId: currentSong.userId,
        timeInSeconds: actualCurrentTime,
        label: bookmarkLabel.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add description if it's not empty (avoid undefined values)
      const trimmedDescription = bookmarkDescription.trim();
      if (trimmedDescription) {
        bookmarkData.description = trimmedDescription;
      }

      await addDoc(collection(db, 'bookmarks'), bookmarkData);
      
      // Trigger bookmark refresh
      window.dispatchEvent(new CustomEvent('refreshBookmarks'));
      
      // Show success feedback
      setBookmarkFeedback({ type: 'success', message: 'Bookmark created successfully!' });
      
      // Reset form
      setBookmarkLabel('');
      setBookmarkDescription('');
      setShowBookmarkModal(false);
      
      // Clear feedback after 3 seconds
      setTimeout(() => setBookmarkFeedback(null), 3000);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      setBookmarkFeedback({ type: 'error', message: 'Failed to create bookmark. Please try again.' });
    } finally {
      setIsCreatingBookmark(false);
    }
  };

  const handleCancelBookmark = () => {
    setShowBookmarkModal(false);
    setBookmarkLabel('');
    setBookmarkDescription('');
    setBookmarkFeedback(null);
  };

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
            <div className="flex items-center justify-center space-x-4">
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

              {/* Add Bookmark Button */}
              <div className="border-l border-gray-600 pl-4 ml-2">
                <button
                  onClick={handleCreateBookmark}
                  disabled={!currentSong}
                  className="p-2 text-gray-400 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Add bookmark at current time"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center space-x-2 text-xs text-gray-400">
              <span className="w-10 text-right">{formatDuration(actualCurrentTime * 1000)}</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={actualDuration}
                  value={actualCurrentTime}
                  onChange={handleSeek}
                  className="progress-bar w-full"
                  style={{ 
                    '--progress-percentage': `${progress}%` 
                  } as React.CSSProperties}
                  title="Seek"
                />
                {/* Bookmark markers */}
                {currentSongBookmarks.length > 0 && actualDuration > 0 && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {currentSongBookmarks.map((bookmark) => {
                      const bookmarkPosition = (bookmark.timeInSeconds / actualDuration) * 100;
                      return (
                        <div
                          key={bookmark.id}
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
                          style={{ left: `${bookmarkPosition}%` }}
                          onClick={() => seekToTime(bookmark.timeInSeconds)}
                          title={`${bookmark.label} - ${Math.floor(bookmark.timeInSeconds / 60)}:${(bookmark.timeInSeconds % 60).toString().padStart(2, '0')}`}
                        >
                          <BookmarkIcon className="w-3 h-3 text-orange-400 hover:text-orange-300 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="w-10">{formatDuration(actualDuration * 1000)}</span>
            </div>

            {/* Bookmarks Section (when available) */}
            {currentSongBookmarks.length > 0 && (
              <div className="w-full mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 flex items-center">
                    <BookmarkIcon className="w-3 h-3 mr-1" />
                    Bookmarks ({currentSongBookmarks.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {currentSongBookmarks.slice(0, 6).map((bookmark) => (
                    <button
                      key={bookmark.id}
                      onClick={() => seekToTime(bookmark.timeInSeconds)}
                      className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded border border-orange-500/30 transition-colors"
                      title={bookmark.description || bookmark.label}
                    >
                      {bookmark.label} ({Math.floor(bookmark.timeInSeconds / 60)}:{(bookmark.timeInSeconds % 60).toString().padStart(2, '0')})
                    </button>
                  ))}
                  {currentSongBookmarks.length > 6 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{currentSongBookmarks.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
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

        {/* Bookmark Creation Feedback */}
        {bookmarkFeedback && (
          <div className={`text-center text-xs mt-2 ${
            bookmarkFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {bookmarkFeedback.message}
          </div>
        )}
      </div>

      {/* Bookmark Creation Modal */}
      <Transition appear show={showBookmarkModal} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleCancelBookmark}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-600">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white mb-4 flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <BookmarkIcon className="w-5 h-5 mr-2 text-orange-400" />
                      Add Bookmark
                    </span>
                    <button
                      onClick={handleCancelBookmark}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </Dialog.Title>

                  <div className="space-y-4">
                    {/* Current time display */}
                    <div className="text-sm text-gray-400">
                      Creating bookmark at: {formatDuration(actualCurrentTime * 1000)}
                    </div>

                    {/* Bookmark label */}
                    <div>
                      <label htmlFor="bookmark-label" className="block text-sm font-medium text-gray-300 mb-1">
                        Label *
                      </label>
                      <input
                        id="bookmark-label"
                        type="text"
                        value={bookmarkLabel}
                        onChange={(e) => setBookmarkLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., Verse, Chorus, Solo..."
                        autoFocus
                      />
                    </div>

                    {/* Bookmark description */}
                    <div>
                      <label htmlFor="bookmark-description" className="block text-sm font-medium text-gray-300 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        id="bookmark-description"
                        value={bookmarkDescription}
                        onChange={(e) => setBookmarkDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Additional notes about this bookmark..."
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleCancelBookmark}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBookmark}
                        disabled={!bookmarkLabel.trim() || isCreatingBookmark}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors"
                      >
                        {isCreatingBookmark ? 'Creating...' : 'Create Bookmark'}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
