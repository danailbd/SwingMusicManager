'use client';

import { useState } from 'react';
import { useAppStatePersistence } from '@/lib/use-app-state-persistence';
import { useMusicPlayer } from './music-player-context';
import { EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline';

export function AppStateDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const { appState, getStateSnapshot, clearState } = useAppStatePersistence();
  const { currentSong, queue, isPlayerVisible } = useMusicPlayer();

  const stateSnapshot = getStateSnapshot();

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 p-2 bg-gray-800/80 backdrop-blur-sm text-gray-400 hover:text-white rounded-lg border border-gray-600 transition-colors"
        title="Show app state debugger"
      >
        <EyeIcon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-96 bg-gray-900/95 backdrop-blur-sm text-white rounded-lg border border-gray-600 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <h3 className="text-sm font-semibold">App State Debugger</h3>
        <div className="flex space-x-1">
          <button
            onClick={clearState}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Clear state"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Hide debugger"
          >
            <EyeSlashIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="p-3 text-xs overflow-y-auto max-h-80">
        <div className="space-y-3">
          {/* Persistence Info */}
          <div>
            <h4 className="text-green-400 font-semibold mb-1">Persistence</h4>
            <div className="text-gray-300 space-y-1">
              <div>Age: {Math.round(stateSnapshot.age / 1000)}s</div>
              <div>Valid: {stateSnapshot.isValid ? '✅' : '❌'}</div>
              <div>Session: {appState.sessionId.split('-').pop()}</div>
            </div>
          </div>

          {/* Navigation State */}
          <div>
            <h4 className="text-blue-400 font-semibold mb-1">Navigation</h4>
            <div className="text-gray-300 space-y-1">
              <div>Active View: <span className="text-yellow-400">{appState.activeView}</span></div>
              <div>Search Query: {appState.searchQuery || '(empty)'}</div>
              <div>Selected Playlist: {appState.selectedPlaylistId || '(none)'}</div>
            </div>
          </div>

          {/* Music Player State */}
          <div>
            <h4 className="text-purple-400 font-semibold mb-1">Music Player</h4>
            <div className="text-gray-300 space-y-1">
              <div>Current Song: {currentSong?.name || '(none)'}</div>
              <div>Queue Length: {queue.length}</div>
              <div>Current Index: {appState.currentIndex}</div>
              <div>Player Visible: {isPlayerVisible ? '✅' : '❌'}</div>
              <div>Playback Position: {appState.playbackPosition}s</div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="text-orange-400 font-semibold mb-1">Preferences</h4>
            <div className="text-gray-300 space-y-1">
              <div>Volume: {Math.round(appState.volume * 100)}%</div>
              <div>Autoplay: {appState.autoplay ? '✅' : '❌'}</div>
            </div>
          </div>

          {/* Storage Info */}
          <div>
            <h4 className="text-gray-400 font-semibold mb-1">Storage</h4>
            <div className="text-gray-300 space-y-1">
              <div>Last Updated: {new Date(appState.lastUpdated).toLocaleTimeString()}</div>
              <div>Size: {JSON.stringify(appState).length} chars</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
