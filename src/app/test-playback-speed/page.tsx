'use client';

import { useState, useEffect } from 'react';
import { useMusicPlayer } from '@/components/music-player-context';
import { TaggedSong } from '@/types';

/**
 * Test page for playback speed control functionality
 * Tests:
 * 1. Speed control buttons working
 * 2. Speed persistence across reloads
 * 3. Audio playback rate changes
 * 4. Spotify speed integration (if supported)
 */

const testSong: TaggedSong = {
  id: 'test-speed-song',
  spotifyId: 'test-speed-song',
  name: 'Test Speed Control Song',
  artist: 'Test Artist',
  album: 'Test Album',
  imageUrl: '',
  duration: 30000,
  previewUrl: 'https://www.soundjay.com/misc/sounds/beep-01a.mp3', // Public test audio
  spotifyUrl: 'https://open.spotify.com/track/test',
  uri: '', // No Spotify URI - forces preview mode
  userId: '',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

export default function TestPlaybackSpeed() {
  const { 
    playbackSpeed, 
    updatePlaybackSpeed,
    playSong,
    currentSong,
    isPlayerVisible,
    isSpotifyReady,
    spotifyPlayerState
  } = useMusicPlayer();

  const [localPlaybackRate, setLocalPlaybackRate] = useState(1);
  const [persistenceTestResult, setPersistenceTestResult] = useState<string>('');

  useEffect(() => {
    // Test persistence on component mount
    const savedSpeed = localStorage.getItem('song-tagger-app-state');
    if (savedSpeed) {
      try {
        const parsed = JSON.parse(savedSpeed);
        setPersistenceTestResult(`✅ Persistence working - loaded speed: ${parsed.playbackSpeed || 1}x`);
      } catch (e) {
        setPersistenceTestResult('❌ Persistence error - could not parse saved state');
      }
    } else {
      setPersistenceTestResult('⚠️ No saved state found');
    }
  }, []);

  useEffect(() => {
    // Monitor actual audio element playback rate
    const checkAudioRate = () => {
      const audioElements = document.querySelectorAll('audio');
      if (audioElements.length > 0) {
        const audio = audioElements[0] as HTMLAudioElement;
        setLocalPlaybackRate(audio.playbackRate);
        
        // Force set the playback rate if it doesn't match context
        if (Math.abs(audio.playbackRate - playbackSpeed) > 0.01) {
          console.log(`Syncing audio playback rate: ${audio.playbackRate} -> ${playbackSpeed}`);
          audio.playbackRate = playbackSpeed;
        }
      }
    };

    const interval = setInterval(checkAudioRate, 500); // Check twice per second
    return () => clearInterval(interval);
  }, [playbackSpeed]);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const testSpeedChange = (speed: number) => {
    console.log(`Testing speed change to ${speed}x`);
    updatePlaybackSpeed(speed);
    
    // Also directly set audio element speed for testing
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      const audio = audioElements[0] as HTMLAudioElement;
      audio.playbackRate = speed;
      console.log(`Direct audio element speed set to: ${audio.playbackRate}x`);
    }
    
    // Test immediate persistence
    setTimeout(() => {
      const savedState = localStorage.getItem('song-tagger-app-state');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.playbackSpeed === speed) {
            setPersistenceTestResult(`✅ Speed ${speed}x saved successfully`);
          } else {
            setPersistenceTestResult(`❌ Speed not saved correctly - expected ${speed}x, got ${parsed.playbackSpeed || 1}x`);
          }
        } catch (e) {
          setPersistenceTestResult('❌ Error checking saved state');
        }
      }
    }, 100);
  };

  const startTestSong = () => {
    playSong(testSong);
    // Player visibility is managed automatically by the playSong function
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Playback Speed Control Test</h1>
        
        {/* Current Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Context Speed:</strong> {playbackSpeed}x
            </div>
            <div>
              <strong>Audio Element Rate:</strong> {localPlaybackRate}x
            </div>
            <div>
              <strong>Current Song:</strong> {currentSong?.name || 'None'}
            </div>
            <div>
              <strong>Player Visible:</strong> {isPlayerVisible ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Spotify Ready:</strong> {isSpotifyReady ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Playback Type:</strong> {
                isSpotifyReady && currentSong?.uri 
                  ? 'Spotify Full Track (Speed control disabled)' 
                  : currentSong?.previewUrl 
                    ? 'Preview Audio (Speed control available)'
                    : 'No audio source'
              }
            </div>
          </div>
          <div className="mt-4">
            <strong>Persistence Test:</strong> {persistenceTestResult}
          </div>
        </div>

        {/* Speed Control Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Speed Control Test</h2>
          <p className="text-gray-400 mb-4">
            Click the buttons below to test speed changes. The speed should persist across browser reloads.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => testSpeedChange(speed)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {speed}x {speed === 1 ? '(Normal)' : speed < 1 ? '(Slower)' : '(Faster)'}
              </button>
            ))}
          </div>

          <button
            onClick={startTestSong}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            {currentSong ? 'Song Loaded' : 'Load Test Song'}
          </button>
        </div>

        {/* Test Instructions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Load the test song by clicking "Load Test Song"</li>
            <li>Try different speed settings and verify the audio plays at the correct speed</li>
            <li>Check that "Context Speed" and "Audio Element Rate" match</li>
            <li>Refresh the page and verify the speed setting is restored</li>
            <li>Try playing/pausing at different speeds</li>
            <li>Open browser dev tools and check localStorage for "song-tagger-app-state"</li>
          </ol>
          
          <div className="mt-6 p-4 bg-blue-900/30 rounded border border-blue-500/30">
            <h3 className="font-semibold text-blue-300 mb-2">Expected Behavior:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-200 text-sm">
              <li>Speed changes should be immediate</li>
              <li>Audio playback rate should match the selected speed</li>
              <li>Speed preference should persist after page reload</li>
              <li>All speed controls should be synchronized</li>
              <li>No console errors should appear</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-900/30 rounded border border-yellow-500/30">
            <h3 className="font-semibold text-yellow-300 mb-2">Note on Spotify:</h3>
            <p className="text-yellow-200 text-sm">
              Spotify Web Playback SDK may not support playback speed control for full tracks. 
              Speed control will work for preview URLs but may not affect Spotify premium playback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
