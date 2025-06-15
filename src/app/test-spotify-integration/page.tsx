'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function TestSpotifyIntegration() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Test authentication
  const { data: authData, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['test-auth'],
    queryFn: async () => {
      const response = await fetch('/api/test-token');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
  });

  // Test Spotify playlists fetch
  const { data: spotifyPlaylists, isLoading: isLoadingSpotify } = useQuery({
    queryKey: ['test-spotify-playlists'],
    queryFn: async () => {
      const response = await fetch('/api/user-playlists');
      if (!response.ok) throw new Error('Failed to fetch Spotify playlists');
      return response.json();
    },
    enabled: !!authData,
  });

  // Test our app playlists
  const { data: appPlaylists, isLoading: isLoadingApp } = useQuery({
    queryKey: ['test-app-playlists'],
    queryFn: async () => {
      const response = await fetch('/api/playlists');
      if (!response.ok) throw new Error('Failed to fetch app playlists');
      return response.json();
    },
    enabled: !!authData,
  });

  const testImportPlaylist = async () => {
    if (!selectedPlaylistId) {
      showNotification('error', 'Please select a playlist to import');
      return;
    }

    try {
      showNotification('info', 'Importing playlist...');
      const response = await fetch('/api/playlists/import-spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotifyPlaylistId: selectedPlaylistId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import playlist');
      }

      showNotification('success', `Successfully imported: ${result.playlist.name} (${result.playlist.songsCount} songs)`);
    } catch (error) {
      showNotification('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSyncPlaylist = async (playlistId: string, action: 'sync' | 'create') => {
    try {
      showNotification('info', `${action === 'create' ? 'Creating' : 'Syncing'} playlist...`);
      const response = await fetch(`/api/playlists/${playlistId}/sync-to-spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} playlist`);
      }

      showNotification('success', `Successfully ${action === 'create' ? 'created' : 'synced'}: ${result.playlist.name}`);
    } catch (error) {
      showNotification('error', `${action === 'create' ? 'Create' : 'Sync'} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Spotify Integration Test</h1>
          <p className="text-gray-300">Test Spotify playlist import and sync functionality</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
              : notification.type === 'error'
              ? 'bg-red-500/20 border border-red-500/30 text-red-400'
              : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
          }`}>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        {/* Authentication Status */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Status</h2>
          {isLoadingAuth ? (
            <p className="text-gray-400">Checking authentication...</p>
          ) : authData ? (
            <div className="text-green-400">
              <p>✓ Authenticated as: {authData.userId}</p>
              <p>✓ Access token: Valid</p>
            </div>
          ) : (
            <p className="text-red-400">✗ Not authenticated</p>
          )}
        </div>

        {/* Spotify Playlists */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Spotify Playlists</h2>
          {isLoadingSpotify ? (
            <p className="text-gray-400">Loading Spotify playlists...</p>
          ) : spotifyPlaylists?.playlists ? (
            <div>
              <p className="text-green-400 mb-4">✓ Found {spotifyPlaylists.playlists.length} Spotify playlists</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {spotifyPlaylists.playlists.map((playlist: any) => (
                  <div 
                    key={playlist.id} 
                    className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                      selectedPlaylistId === playlist.id 
                        ? 'border-blue-500/50 bg-blue-500/10' 
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                  >
                    <div>
                      <p className="text-white font-medium">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks} tracks • by {playlist.owner}</p>
                    </div>
                    {selectedPlaylistId === playlist.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testImportPlaylist();
                        }}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                      >
                        Import
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-400">✗ Failed to load Spotify playlists</p>
          )}
        </div>

        {/* App Playlists */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">App Playlists</h2>
          {isLoadingApp ? (
            <p className="text-gray-400">Loading app playlists...</p>
          ) : appPlaylists ? (
            <div>
              <p className="text-green-400 mb-4">✓ Found {appPlaylists.length} app playlists</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {appPlaylists.map((playlist: any) => (
                  <div key={playlist.id} className="flex items-center justify-between p-3 rounded border border-white/10">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium">{playlist.name}</p>
                        {playlist.isSpotifyPlaylist && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Spotify playlist" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{playlist.songs?.length || 0} songs</p>
                      {playlist.spotifyId && (
                        <p className="text-green-400 text-xs">Spotify ID: {playlist.spotifyId}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {playlist.isSpotifyPlaylist ? (
                        <button
                          onClick={() => testSyncPlaylist(playlist.id, 'sync')}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                        >
                          Sync
                        </button>
                      ) : (
                        <button
                          onClick={() => testSyncPlaylist(playlist.id, 'create')}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                        >
                          Create on Spotify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-400">✗ Failed to load app playlists</p>
          )}
        </div>

        {/* Test Instructions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-2 text-gray-300">
            <p>1. ✓ Authentication should show as valid</p>
            <p>2. ✓ Spotify playlists should load from your account</p>
            <p>3. ✓ Click on a Spotify playlist to select it, then click "Import"</p>
            <p>4. ✓ Imported playlists should appear in the App Playlists section</p>
            <p>5. ✓ Use "Sync" to update existing Spotify playlists</p>
            <p>6. ✓ Use "Create on Spotify" to add local playlists to Spotify</p>
          </div>
        </div>
      </div>
    </div>
  );
}
