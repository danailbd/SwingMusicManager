'use client';

import { useState } from 'react';
import { useAppStatePersistence } from '@/lib/use-app-state-persistence';
import { 
  Cog6ToothIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface PersistenceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersistenceSettings({ isOpen, onClose }: PersistenceSettingsProps) {
  const { appState, clearState, getStateSnapshot } = useAppStatePersistence();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const stateSnapshot = getStateSnapshot();

  const handleClearState = () => {
    clearState();
    setShowConfirmClear(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-900 border border-gray-600 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">App State Persistence Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Current State Info */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h4 className="text-lg font-medium text-white mb-3">Current State Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Session Age:</span>
                <span className="text-white ml-2">{Math.round(stateSnapshot.age / 1000)}s</span>
              </div>
              <div>
                <span className="text-gray-400">State Size:</span>
                <span className="text-white ml-2">{JSON.stringify(appState).length} chars</span>
              </div>
              <div>
                <span className="text-gray-400">Valid Until:</span>
                <span className="text-white ml-2">
                  {new Date(appState.lastUpdated + 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`ml-2 ${stateSnapshot.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {stateSnapshot.isValid ? 'Valid' : 'Expired'}
                </span>
              </div>
            </div>
          </div>

          {/* What's Being Saved */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-3">What's Being Saved</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Navigation State</div>
                    <div className="text-gray-400 text-sm">Active tab, search queries, selected playlists</div>
                  </div>
                </div>
                <div className="text-green-400 text-sm">Always Enabled</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Music Player State</div>
                    <div className="text-gray-400 text-sm">Current song, queue, playback position</div>
                  </div>
                </div>
                <div className="text-green-400 text-sm">Always Enabled</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">User Preferences</div>
                    <div className="text-gray-400 text-sm">Volume level, autoplay settings</div>
                  </div>
                </div>
                <div className="text-green-400 text-sm">Always Enabled</div>
              </div>
            </div>
          </div>

          {/* Privacy & Storage Info */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <div className="text-blue-400 font-medium mb-1">Privacy & Storage</div>
                <ul className="text-gray-300 space-y-1">
                  <li>• State is stored locally in your browser only</li>
                  <li>• No data is sent to external servers</li>
                  <li>• State automatically expires after 24 hours</li>
                  <li>• Logging out clears all stored state</li>
                  <li>• You can manually clear state at any time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed State Breakdown */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-3">Current State Breakdown</h4>
            <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
              <div className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Active View:</span>
                <span className="text-white">{appState.activeView}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Search Query:</span>
                <span className="text-white truncate max-w-40">{appState.searchQuery || '(empty)'}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Current Song:</span>
                <span className="text-white truncate max-w-40">{appState.currentSong?.name || '(none)'}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Queue Length:</span>
                <span className="text-white">{appState.queue.length} songs</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Player Visible:</span>
                <span className="text-white">{appState.isPlayerVisible ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Volume:</span>
                <span className="text-white">{Math.round(appState.volume * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Clear All State</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearState}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
