'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface AuthTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function AuthTestPage() {
  const [tests, setTests] = useState<AuthTest[]>([
    { name: '🔐 Access Token Check', status: 'pending', message: 'Checking access token...' },
    { name: '👤 User ID Persistence', status: 'pending', message: 'Checking user ID cookie...' },
    { name: '📋 API Functionality', status: 'pending', message: 'Testing API with stored credentials...' },
  ]);

  const [userInfo, setUserInfo] = useState<any>(null);

  const updateTest = (index: number, update: Partial<AuthTest>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...update } : test));
  };

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test 1: Check if we have authentication
        const response = await fetch('/api/test-spotify-api');
        
        if (response.ok) {
          const data = await response.json();
          
          updateTest(0, {
            status: 'success',
            message: '✅ Access token found and valid',
          });

          updateTest(1, {
            status: 'success',
            message: `✅ User ID persisted: ${data.userId}`,
            details: { userId: data.userId }
          });

          updateTest(2, {
            status: 'success',
            message: `✅ API working - Found ${data.playlistCount} playlists`,
            details: data
          });

          setUserInfo(data);
        } else {
          const errorData = await response.json();
          
          updateTest(0, {
            status: 'error',
            message: '❌ No valid access token found'
          });

          updateTest(1, {
            status: 'error',
            message: '❌ User ID not persisted'
          });

          updateTest(2, {
            status: 'error',
            message: `❌ API test failed: ${errorData.error}`
          });
        }
      } catch (error) {
        console.error('Auth test error:', error);
        tests.forEach((_, index) => {
          updateTest(index, {
            status: 'error',
            message: '❌ Test failed due to network error'
          });
        });
      }
    };

    runTests();
  }, []);

  const getStatusIcon = (status: AuthTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-yellow-500 animate-spin" />;
    }
  };

  const allPassed = tests.every(test => test.status === 'success');
  const anyFailed = tests.some(test => test.status === 'error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-4">🔑 Authentication & User ID Test</h1>
          <p className="text-gray-300 mb-8">Testing Spotify user ID persistence during authentication</p>

          {/* Overall Status */}
          <div className={`p-6 rounded-xl mb-8 ${
            allPassed ? 'bg-green-500/20 border border-green-500/30' :
            anyFailed ? 'bg-red-500/20 border border-red-500/30' :
            'bg-blue-500/20 border border-blue-500/30'
          }`}>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {allPassed ? '🎉 Authentication Working!' :
               anyFailed ? '⚠️ Authentication Issues' :
               '⏳ Testing Authentication...'}
            </h2>
            <p className="text-gray-200">
              {allPassed ? 'User ID is properly persisted and API calls are working correctly.' :
               anyFailed ? 'Some authentication components need attention.' :
               'Please wait while we test the authentication system...'}
            </p>
          </div>

          {/* Test Results */}
          <div className="grid gap-6 mb-8">
            {tests.map((test, index) => (
              <div key={index} className={`bg-white/5 rounded-xl p-6 border transition-all duration-300 ${
                test.status === 'success' ? 'border-green-500/30 bg-green-500/5' :
                test.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                'border-white/10'
              }`}>
                <div className="flex items-center space-x-4 mb-3">
                  {getStatusIcon(test.status)}
                  <h3 className="text-xl font-semibold text-white">{test.name}</h3>
                </div>
                <p className={`text-lg ml-10 ${
                  test.status === 'success' ? 'text-green-300' :
                  test.status === 'error' ? 'text-red-300' :
                  'text-gray-300'
                }`}>
                  {test.message}
                </p>
                {test.details && (
                  <div className="mt-4 ml-10">
                    <details className="text-sm">
                      <summary className="text-gray-400 cursor-pointer hover:text-white mb-2">
                        View Details
                      </summary>
                      <div className="p-4 bg-black/30 rounded-lg">
                        <pre className="text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Information */}
          {userInfo && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <UserIcon className="w-6 h-6 mr-2" />
                Authenticated User Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-blue-400">{userInfo.userId}</div>
                  <div className="text-gray-300">Spotify User ID</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-green-400">{userInfo.playlistCount}</div>
                  <div className="text-gray-300">Available Playlists</div>
                </div>
              </div>
              
              {userInfo.playlists && userInfo.playlists.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Sample Playlists:</h4>
                  <div className="space-y-2">
                    {userInfo.playlists.map((playlist: any, index: number) => (
                      <div key={index} className="bg-white/5 p-3 rounded-lg">
                        <div className="font-medium text-white">{playlist.name}</div>
                        <div className="text-sm text-gray-400">
                          {playlist.tracks} tracks • Owner: {playlist.owner}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a 
              href="/dashboard" 
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </a>
            <a 
              href="/" 
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Home
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Rerun Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
