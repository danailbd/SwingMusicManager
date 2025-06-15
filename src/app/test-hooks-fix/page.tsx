'use client';

import { useState, useEffect } from 'react';
import { useAppStatePersistence } from '@/lib/use-app-state-persistence';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function TestHooksFix() {
  const {
    appState,
    isLoaded,
    updateActiveView,
    updateSearchQuery,
  } = useAppStatePersistence();
  
  const [testState, setTestState] = useState('');
  
  useEffect(() => {
    if (isLoaded) {
      setTestState('Hooks are working correctly!');
    }
  }, [isLoaded]);

  // Show loading state while app state is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <MusicalNoteIcon className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Testing Hooks Order</h2>
          <p className="text-gray-400">Loading app state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">React Hooks Order Test</h1>
        
        <div className="grid gap-6">
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400">App State Persistence Hook: {isLoaded ? 'Loaded' : 'Loading'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400">useState Hook: {testState || 'Initializing'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400">useEffect Hook: Working</span>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">App State</h2>
            <pre className="text-gray-300 text-sm overflow-auto">
              {JSON.stringify(appState, null, 2)}
            </pre>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
            <div className="space-y-3">
              <button
                onClick={() => updateActiveView('search')}
                className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Set Active View to Search
              </button>
              <button
                onClick={() => updateSearchQuery(`Test query ${Date.now()}`)}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors ml-3"
              >
                Update Search Query
              </button>
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
