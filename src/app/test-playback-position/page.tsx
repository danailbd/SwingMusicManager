'use client';

import { useState, useEffect } from 'react';
import { useAppStatePersistence } from '@/lib/use-app-state-persistence';
import { useMusicPlayer } from '@/components/music-player-context';
import { MusicalNoteIcon, PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function TestPlaybackPosition() {
  const {
    appState,
    isLoaded,
    updatePlaybackPosition,
    clearState
  } = useAppStatePersistence();
  
  const {
    currentSong,
    playbackPosition,
    updatePlaybackPosition: updateContext,
    isSpotifyReady,
    spotifyPlayer
  } = useMusicPlayer();

  const [testPosition, setTestPosition] = useState(0);

  useEffect(() => {
    if (isLoaded) {
      setTestPosition(appState.playbackPosition || 0);
    }
  }, [isLoaded, appState]);

  const simulatePlayback = () => {
    const newPosition = testPosition + 10; // Simulate 10 seconds forward
    setTestPosition(newPosition);
    updatePlaybackPosition(newPosition);
    updateContext(newPosition);
  };

  const resetPosition = () => {
    setTestPosition(0);
    updatePlaybackPosition(0);
    updateContext(0);
  };

  const testSpotifyPlayback = async () => {
    if (spotifyPlayer && currentSong?.uri) {
      try {
        console.log('Testing Spotify playback with position:', testPosition);
        if (spotifyPlayer.playTrackWithPosition) {
          await spotifyPlayer.playTrackWithPosition(currentSong.uri, testPosition);
        } else {
          await spotifyPlayer.playTrack(currentSong.uri);
          setTimeout(() => {
            spotifyPlayer.seek(testPosition * 1000);
          }, 1000);
        }
      } catch (error) {
        console.error('Spotify playback test failed:', error);
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <MusicalNoteIcon className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Test</h2>
          <p className="text-gray-400">Initializing playback position test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Playback Position Persistence Test</h1>
        
        <div className="grid gap-6">
          {/* Current State */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current State</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-green-400 font-medium mb-2">App State</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white ml-2">{appState.playbackPosition || 0}s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current Song:</span>
                    <span className="text-white ml-2">{appState.currentSong?.name || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Player Visible:</span>
                    <span className="text-white ml-2">{appState.isPlayerVisible ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white ml-2">
                      {new Date(appState.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-blue-400 font-medium mb-2">Music Player Context</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Context Position:</span>
                    <span className="text-white ml-2">{playbackPosition}s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Spotify Ready:</span>
                    <span className={`ml-2 ${isSpotifyReady ? 'text-green-400' : 'text-red-400'}`}>
                      {isSpotifyReady ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current Song:</span>
                    <span className="text-white ml-2">{currentSong?.name || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              {/* Position Control */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Test Position (seconds)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={testPosition}
                    onChange={(e) => setTestPosition(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-white min-w-[60px]">{testPosition}s</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={simulatePlayback}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>Simulate +10s</span>
                </button>
                
                <button
                  onClick={resetPosition}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Reset Position</span>
                </button>

                <button
                  onClick={testSpotifyPlayback}
                  disabled={!isSpotifyReady || !currentSong?.uri}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MusicalNoteIcon className="w-4 h-4" />
                  <span>Test Spotify Resume</span>
                </button>

                <button
                  onClick={clearState}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <span>Clear All State</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">1</div>
                <div>
                  <p className="font-medium">Position Persistence Test</p>
                  <p className="text-sm text-gray-400">Use the slider or "Simulate +10s" button to update the playback position. Refresh the page to verify the position is restored.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">2</div>
                <div>
                  <p className="font-medium">Spotify Resume Test</p>
                  <p className="text-sm text-gray-400">If you have a song playing, use "Test Spotify Resume" to verify position-aware playback works correctly.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">3</div>
                <div>
                  <p className="font-medium">Error Handling</p>
                  <p className="text-sm text-gray-400">Check the browser console for any Spotify playback errors and verify they are handled gracefully.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <MusicalNoteIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
}
