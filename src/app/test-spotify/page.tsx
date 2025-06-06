'use client';

import { useState } from 'react';

export default function SpotifyTest() {
  const [status, setStatus] = useState('Ready to test');
  const [authUrl, setAuthUrl] = useState('');

  const generateAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
    const scopes = [
      'user-read-private',
      'user-read-email', 
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-library-read',
      'user-library-modify',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
    ];
    
    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${encodeURIComponent(redirectUri || '')}`;
    setAuthUrl(url);
    setStatus('Auth URL generated successfully');
  };

  const testAuth = () => {
    generateAuthUrl();
    if (authUrl) {
      window.open(authUrl, '_blank');
      setStatus('Redirecting to Spotify for authentication...');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎵 Spotify Integration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Environment Variables Status:</h2>
        <div className="space-y-1 text-sm">
          <p><strong>Client ID:</strong> {process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}</p>
          <p><strong>Redirect URI:</strong> {process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ? '✅ Set' : '❌ Missing'}</p>
          <p><strong>Firebase Project:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2"><strong>Status:</strong> {status}</p>
        </div>

        <button
          onClick={generateAuthUrl}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
        >
          Generate Auth URL
        </button>

        <button
          onClick={testAuth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={!authUrl}
        >
          Test Spotify Login
        </button>

        {authUrl && (
          <div className="mt-4 p-4 bg-yellow-50 border rounded">
            <h3 className="font-semibold mb-2">Generated Auth URL:</h3>
            <p className="text-xs break-all">{authUrl}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border rounded">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Generate Auth URL" to create the Spotify authorization URL</li>
          <li>Click "Test Spotify Login" to open Spotify authentication in a new tab</li>
          <li>Login with your Spotify account and authorize the app</li>
          <li>You should be redirected back to /dashboard with authentication</li>
          <li>Check the browser console for any errors</li>
        </ol>
      </div>
    </div>
  );
}
