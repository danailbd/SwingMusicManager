'use client';

import { useState } from 'react';
import { PlayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function APITest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(endpoint);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();
      
      setResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          status: response.ok ? 'success' : 'error',
          data,
          statusCode: response.status
        }
      }));
    } catch (error) {
      setResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          statusCode: 'Network Error'
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const endpoints = [
    { url: '/api/test-spotify-api', name: 'Spotify API Test', method: 'GET' },
    { url: '/api/test-firebase', name: 'Firebase Test', method: 'GET' },
    { url: '/api/playlists', name: 'Get Playlists', method: 'GET' },
    { 
      url: '/api/playlists', 
      name: 'Create Test Playlist', 
      method: 'POST',
      body: { name: 'API Test Playlist', description: 'Created via API test' }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">🔧 API Endpoint Testing</h1>
          <p className="text-gray-300 mb-8">Test individual API endpoints to verify functionality</p>

          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium">{endpoint.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {endpoint.method} {endpoint.url}
                    </p>
                  </div>
                  <button
                    onClick={() => testEndpoint(endpoint.url, endpoint.method, endpoint.body)}
                    disabled={loading === endpoint.url}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading === endpoint.url ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Testing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Test
                      </div>
                    )}
                  </button>
                </div>

                {results[endpoint.url] && (
                  <div className="mt-4 p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center mb-2">
                      {results[endpoint.url].status === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className={`font-medium ${
                        results[endpoint.url].status === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {results[endpoint.url].status === 'success' ? 'Success' : 'Error'}
                      </span>
                      <span className="text-gray-400 ml-2">
                        ({results[endpoint.url].statusCode})
                      </span>
                    </div>
                    
                    <pre className="text-gray-300 text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        results[endpoint.url].data || results[endpoint.url].error, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 p-6 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <h3 className="text-yellow-400 font-semibold mb-4">🚀 Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/"
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
              >
                <h4 className="text-white font-medium mb-2">🏠 Homepage</h4>
                <p className="text-gray-400 text-sm">Start from the beginning and test authentication</p>
              </a>
              <a
                href="/dashboard"
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
              >
                <h4 className="text-white font-medium mb-2">📊 Dashboard</h4>
                <p className="text-gray-400 text-sm">Access the main application interface</p>
              </a>
              <a
                href="/test-integration"
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
              >
                <h4 className="text-white font-medium mb-2">🧪 Integration Test</h4>
                <p className="text-gray-400 text-sm">Run comprehensive system tests</p>
              </a>
              <a
                href="/test-e2e"
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
              >
                <h4 className="text-white font-medium mb-2">🔄 E2E Test</h4>
                <p className="text-gray-400 text-sm">End-to-end workflow testing</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
