'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function AuthFirebaseTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '🍪 Check Spotify Cookies', status: 'pending', message: 'Checking stored cookies...' },
    { name: '🔐 Validate Spotify Auth', status: 'pending', message: 'Validating authentication...' },
    { name: '🔥 Test Firebase Connection', status: 'pending', message: 'Testing Firebase operations...' },
    { name: '📝 Test Firebase Write', status: 'pending', message: 'Testing write permissions...' },
    { name: '📖 Test Firebase Read', status: 'pending', message: 'Testing read permissions...' },
  ]);

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...update } : test));
  };

  // Test Firebase connection
  const { data: firebaseData, error: firebaseError, refetch: refetchFirebase } = useQuery({
    queryKey: ['firebase-test'],
    queryFn: async () => {
      const response = await fetch('/api/test-firebase');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Firebase test failed');
      return data;
    },
    retry: false
  });

  // Test Spotify auth
  const { data: spotifyData, error: spotifyError } = useQuery({
    queryKey: ['spotify-auth-test'],
    queryFn: async () => {
      const response = await fetch('/api/test-spotify-api');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Spotify auth test failed');
      return data;
    },
    retry: false
  });

  useEffect(() => {
    // Test 1: Check cookies
    const accessToken = document.cookie.includes('spotify_access_token');
    const userId = document.cookie.includes('spotify_user_id');
    
    updateTest(0, {
      status: accessToken && userId ? 'success' : 'error',
      message: accessToken && userId 
        ? '✅ Both access_token and user_id cookies found'
        : `❌ Missing cookies: ${!accessToken ? 'access_token ' : ''}${!userId ? 'user_id' : ''}`,
      details: { accessToken: accessToken, userId: userId }
    });
  }, []);

  useEffect(() => {
    // Test 2: Spotify auth
    if (spotifyData) {
      updateTest(1, {
        status: 'success',
        message: `✅ Spotify auth valid - User: ${spotifyData.user?.display_name}`,
        details: spotifyData
      });
    } else if (spotifyError) {
      updateTest(1, {
        status: 'error',
        message: `❌ Spotify auth failed: ${spotifyError.message}`,
        details: spotifyError
      });
    }
  }, [spotifyData, spotifyError]);

  useEffect(() => {
    // Test 3-5: Firebase tests
    if (firebaseData) {
      updateTest(2, {
        status: 'success',
        message: '✅ Firebase connection successful',
        details: firebaseData
      });
      
      updateTest(3, {
        status: firebaseData.status === 'success' ? 'success' : 'error',
        message: firebaseData.status === 'success' 
          ? '✅ Firebase write permissions working'
          : `❌ Firebase write failed: ${firebaseData.message}`,
        details: firebaseData
      });

      updateTest(4, {
        status: firebaseData.documentsCount !== undefined ? 'success' : 'error',
        message: firebaseData.documentsCount !== undefined
          ? `✅ Firebase read successful - ${firebaseData.documentsCount} documents`
          : '❌ Firebase read failed',
        details: firebaseData
      });
    } else if (firebaseError) {
      updateTest(2, {
        status: 'error',
        message: `❌ Firebase connection failed: ${firebaseError.message}`,
        details: firebaseError
      });
      
      updateTest(3, {
        status: 'error',
        message: '❌ Cannot test write - connection failed'
      });
      
      updateTest(4, {
        status: 'error',
        message: '❌ Cannot test read - connection failed'
      });
    }
  }, [firebaseData, firebaseError]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const retryFirebaseTest = () => {
    updateTest(2, { status: 'pending', message: 'Retrying Firebase test...' });
    updateTest(3, { status: 'pending', message: 'Pending...' });
    updateTest(4, { status: 'pending', message: 'Pending...' });
    refetchFirebase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-4">🔧 Auth & Firebase Diagnostics</h1>
          <p className="text-gray-300 mb-8">Testing authentication and database permissions</p>

          {/* Firebase Rules Warning */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">⚠️ Firebase Rules Update Required</h2>
            <p className="text-yellow-200 mb-4">
              If you're seeing Firebase permission errors, you need to update your Firestore rules:
            </p>
            <ol className="text-yellow-100 text-sm space-y-2 ml-4">
              <li>1. Go to <a href="https://console.firebase.google.com" className="text-blue-300 underline" target="_blank">Firebase Console</a></li>
              <li>2. Select your project → Firestore Database → Rules</li>
              <li>3. Replace rules with: <code className="bg-black/30 px-2 py-1 rounded">allow read, write: if true;</code></li>
              <li>4. Click "Publish"</li>
              <li>5. Click "Retry Firebase Test" below</li>
            </ol>
          </div>

          {/* Test Results */}
          <div className="space-y-4 mb-8">
            {tests.map((test, index) => (
              <div key={index} className={`bg-white/5 rounded-xl p-6 border ${
                test.status === 'success' ? 'border-green-500/30 bg-green-500/5' :
                test.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                'border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(test.status)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                      <p className="text-gray-300">{test.message}</p>
                    </div>
                  </div>
                  {index >= 2 && test.status === 'error' && (
                    <button
                      onClick={retryFirebaseTest}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Retry Firebase Test
                    </button>
                  )}
                </div>
                {test.details && (
                  <details className="mt-4">
                    <summary className="text-gray-400 cursor-pointer">Technical Details</summary>
                    <pre className="mt-2 p-4 bg-black/30 rounded-lg text-xs text-gray-300 overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </a>
            <a
              href="/test-e2e"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Run Full E2E Test
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Refresh Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
