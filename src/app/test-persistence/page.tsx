'use client';

import { useState, useEffect } from 'react';
import { useAppStatePersistence } from '@/lib/use-app-state-persistence';
import { TaggedSong } from '@/types';
import { 
  PlayIcon, 
  ArrowPathIcon, 
  TrashIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';

export default function TestPersistencePage() {
  const {
    appState,
    isLoaded,
    updateActiveView,
    updateSearchQuery,
    updateCurrentSong,
    updateQueue,
    updatePlayerVisibility,
    updatePlaybackPosition,
    clearState,
    getStateSnapshot
  } = useAppStatePersistence();

  const [testSong] = useState<TaggedSong>({
    id: 'test-song-1',
    spotifyId: 'test-spotify-id',
    name: 'Test Song for Persistence',
    artist: 'Test Artist',
    album: 'Test Album',
    imageUrl: 'https://via.placeholder.com/300x300/1a1a1a/green?text=Test+Song',
    duration: 180000, // 3 minutes
    previewUrl: null,
    spotifyUrl: 'https://open.spotify.com/track/test',
    uri: 'spotify:track:test',
    userId: 'test-user',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [testQueue] = useState<TaggedSong[]>([
    testSong,
    {
      ...testSong,
      id: 'test-song-2',
      name: 'Second Test Song',
      spotifyId: 'test-spotify-id-2',
    },
    {
      ...testSong,
      id: 'test-song-3',
      name: 'Third Test Song',
      spotifyId: 'test-spotify-id-3',
    }
  ]);

  const stateSnapshot = getStateSnapshot();

  const testActions = [
    {
      label: 'Set Active View to Library',
      action: () => updateActiveView('library'),
      description: 'Changes the active tab to library view'
    },
    {
      label: 'Set Active View to Playlists',
      action: () => updateActiveView('playlists'),
      description: 'Changes the active tab to playlists view'
    },
    {
      label: 'Update Search Query',
      action: () => updateSearchQuery('test search query ' + Date.now()),
      description: 'Sets a test search query'
    },
    {
      label: 'Set Current Song',
      action: () => updateCurrentSong(testSong),
      description: 'Sets a test song as currently playing'
    },
    {
      label: 'Set Queue',
      action: () => updateQueue(testQueue, 1),
      description: 'Sets a test queue with 3 songs, index 1'
    },
    {
      label: 'Show Player',
      action: () => updatePlayerVisibility(true),
      description: 'Makes the music player visible'
    },
    {
      label: 'Hide Player',
      action: () => updatePlayerVisibility(false),
      description: 'Hides the music player'
    },
    {
      label: 'Set Playback Position',
      action: () => updatePlaybackPosition(Math.floor(Math.random() * 180)),
      description: 'Sets a random playback position'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">App State Persistence Test</h1>
          <p className="text-gray-300 text-lg">
            Test the persistence of app state across page reloads and sessions
          </p>
        </div>

        {/* Status */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <ClockIcon className="w-6 h-6 mr-2 text-blue-400" />
            Persistence Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${isLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
                {isLoaded ? '✅ Loaded' : '⏳ Loading'}
              </div>
              <div className="text-sm text-gray-400">State Loaded</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${stateSnapshot.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {stateSnapshot.isValid ? '✅ Valid' : '❌ Expired'}
              </div>
              <div className="text-sm text-gray-400">State Validity</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {Math.round(stateSnapshot.age / 1000)}s
              </div>
              <div className="text-sm text-gray-400">State Age</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Session ID:</span>
              <span className="text-green-400 font-mono text-sm">
                {appState.sessionId.split('-').pop()}
              </span>
            </div>
          </div>
        </div>

        {/* Current State Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navigation State */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Navigation State</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Active View:</span>
                <span className="text-blue-400 font-semibold capitalize">
                  {appState.activeView}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Search Query:</span>
                <span className="text-yellow-400 truncate max-w-40">
                  {appState.searchQuery || '(empty)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Selected Playlist:</span>
                <span className="text-purple-400">
                  {appState.selectedPlaylistId || '(none)'}
                </span>
              </div>
            </div>
          </div>

          {/* Music Player State */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Music Player State</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Current Song:</span>
                <span className="text-green-400 truncate max-w-40">
                  {appState.currentSong?.name || '(none)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Queue Length:</span>
                <span className="text-orange-400">{appState.queue.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Current Index:</span>
                <span className="text-pink-400">{appState.currentIndex}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Player Visible:</span>
                <span className={appState.isPlayerVisible ? 'text-green-400' : 'text-red-400'}>
                  {appState.isPlayerVisible ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Playback Position:</span>
                <span className="text-cyan-400">{appState.playbackPosition}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <PlayIcon className="w-6 h-6 mr-2 text-green-400" />
            Test Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testActions.map((action, index) => (
              <div key={index} className="border border-white/10 rounded-lg p-4">
                <button
                  onClick={action.action}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors mb-2"
                >
                  {action.label}
                </button>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Test Instructions</h3>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">1.</span>
              <span>Click various test actions to change the app state</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">2.</span>
              <span>Reload the page (Cmd/Ctrl + R) to test persistence</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">3.</span>
              <span>Navigate to other pages and come back</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">4.</span>
              <span>Close the tab and reopen to test session persistence</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">5.</span>
              <span>State automatically expires after 24 hours</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Reload Page</span>
          </button>
          
          <button
            onClick={clearState}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Clear State</span>
          </button>
          
          <a
            href="/dashboard"
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <MusicalNoteIcon className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
}
