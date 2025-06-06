'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function TestDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activeView, setActiveView] = useState('search');

  // Test authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/test-spotify-api');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserInfo(data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

  // Test Spotify playlists query
  const { data: spotifyPlaylists, isLoading, error } = useQuery({
    queryKey: ['test-spotify-playlists'],
    queryFn: async () => {
      const response = await fetch('/api/test-spotify-api');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const navigation = [
    { id: 'search', label: 'Search' },
    { id: 'library', label: 'My Library' },
    { id: 'tags', label: 'Tags' },
    { id: 'playlists', label: 'Playlists' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8">🔧 Dashboard Debug Test</h1>
          
          {/* Authentication Status */}
          <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <h2 className="text-xl text-white mb-4">Authentication Status</h2>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                {isAuthenticated ? 'Connected to Spotify' : 'Not connected'}
              </span>
            </div>
            {userInfo && (
              <div className="mt-3 text-gray-300">
                <p>User ID: {userInfo.userId}</p>
                <p>Playlists: {userInfo.playlistCount}</p>
              </div>
            )}
          </div>

          {/* Navigation Test */}
          <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <h2 className="text-xl text-white mb-4">Navigation Test</h2>
            <div className="flex space-x-2 mb-4">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    console.log('Navigation clicked:', item.id);
                    setActiveView(item.id);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-gray-300">Active View: <span className="text-white font-semibold">{activeView}</span></p>
          </div>

          {/* Spotify Playlists Test */}
          <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <h2 className="text-xl text-white mb-4">Spotify Playlists Access Test</h2>
            {!isAuthenticated ? (
              <p className="text-red-400">Please authenticate with Spotify first</p>
            ) : isLoading ? (
              <p className="text-yellow-400">Loading playlists...</p>
            ) : error ? (
              <p className="text-red-400">Error: {error.message}</p>
            ) : spotifyPlaylists ? (
              <div>
                <p className="text-green-400 mb-3">✅ Successfully loaded {spotifyPlaylists.playlistCount} playlists</p>
                <div className="space-y-2">
                  {spotifyPlaylists.playlists?.map((playlist: any) => (
                    <div key={playlist.id} className="p-3 bg-white/5 rounded border border-white/10">
                      <p className="text-white font-medium">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks} tracks • by {playlist.owner}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No playlist data available</p>
            )}
          </div>

          {/* Console Log Test */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h2 className="text-xl text-white mb-4">Interactive Test</h2>
            <button
              onClick={() => {
                console.log('Test button clicked!');
                alert('Button is working! Check console for more details.');
              }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Test Click Functionality
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
