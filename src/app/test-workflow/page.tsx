'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'completed' | 'warning' | 'error';
  instructions: string;
  result?: string;
}

export default function WorkflowTest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'auth',
      name: '🔐 Authentication',
      description: 'Connect to Spotify',
      status: 'pending',
      instructions: '1. Go to the homepage\n2. Click "Connect to Spotify"\n3. Authorize the application\n4. You should be redirected to the dashboard'
    },
    {
      id: 'search',
      name: '🔍 Search for Music',
      description: 'Test song search functionality',
      status: 'pending',
      instructions: '1. In the dashboard, ensure "Search" tab is active\n2. Type "Billie Jean" in the search box\n3. Verify that Michael Jackson songs appear\n4. Check that album art, artist, and duration are displayed'
    },
    {
      id: 'tag-create',
      name: '🏷️ Create Custom Tags',
      description: 'Create new tags for organizing music',
      status: 'pending',
      instructions: '1. Click the tag icon (🏷️) on any song\n2. Click "Create New Tag"\n3. Enter tag name like "Favorites" or "Workout"\n4. Click Create\n5. Verify the tag appears with a random color'
    },
    {
      id: 'tag-assign',
      name: '📌 Assign Tags to Songs',
      description: 'Tag songs with custom labels',
      status: 'pending',
      instructions: '1. Click the tag icon on a song\n2. Select one or more tags\n3. Click "Save Tags"\n4. Verify the modal closes and the song is tagged'
    },
    {
      id: 'library',
      name: '📚 View Tagged Library',
      description: 'Check your tagged songs',
      status: 'pending',
      instructions: '1. Click on "My Library" tab\n2. Verify your tagged songs appear\n3. Check that tags are displayed for each song\n4. Test filtering by tags if available'
    },
    {
      id: 'playlist-create',
      name: '📂 Create Custom Playlist',
      description: 'Create a new playlist',
      status: 'pending',
      instructions: '1. Go to "Playlists" tab\n2. Click "New Playlist"\n3. Enter name and description\n4. Click Create\n5. Verify playlist appears in the list'
    },
    {
      id: 'playlist-import',
      name: '📥 Import Spotify Playlist',
      description: 'Import existing Spotify playlists',
      status: 'pending',
      instructions: '1. In Playlists tab, check "Your Spotify Playlists" section\n2. Find one of your Spotify playlists\n3. Click "Import & Tag Songs"\n4. Verify the import process works'
    },
    {
      id: 'performance',
      name: '⚡ Performance Test',
      description: 'Test with multiple operations',
      status: 'pending',
      instructions: '1. Search for multiple different songs\n2. Create several tags\n3. Tag multiple songs\n4. Create multiple playlists\n5. Verify the app remains responsive'
    }
  ]);

  const updateStepStatus = (index: number, status: WorkflowStep['status'], result?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, result } : step
    ));
  };

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">🎯 User Workflow Testing</h1>
          <p className="text-gray-300 mb-8">Complete end-to-end user journey testing</p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Progress</span>
              <span>{completedSteps}/{totalSteps} steps completed</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <a href="/" className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-center hover:bg-blue-500/30 transition-colors duration-200">
              <div className="text-2xl mb-2">🏠</div>
              <div className="text-white text-sm">Homepage</div>
            </a>
            <a href="/dashboard" className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center hover:bg-green-500/30 transition-colors duration-200">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-white text-sm">Dashboard</div>
            </a>
            <a href="/test-integration" className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg text-center hover:bg-purple-500/30 transition-colors duration-200">
              <div className="text-2xl mb-2">🧪</div>
              <div className="text-white text-sm">Integration</div>
            </a>
            <a href="/test-api" className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg text-center hover:bg-orange-500/30 transition-colors duration-200">
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-white text-sm">API Test</div>
            </a>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`bg-white/5 rounded-lg p-6 border transition-all duration-200 ${
                  index === currentStep 
                    ? 'border-blue-500/50 ring-2 ring-blue-500/20' 
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {getStatusIcon(step.status)}
                    <div>
                      <h3 className="text-white font-medium text-lg">{step.name}</h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {index === currentStep && (
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full text-sm">
                        Current
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentStep(index)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors duration-200"
                    >
                      Focus
                    </button>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-2">📋 Instructions:</h4>
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap">{step.instructions}</pre>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => updateStepStatus(index, 'completed', 'Manual verification completed')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors duration-200"
                  >
                    ✅ Completed
                  </button>
                  <button
                    onClick={() => updateStepStatus(index, 'warning', 'Partial success or minor issues')}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors duration-200"
                  >
                    ⚠️ Warning
                  </button>
                  <button
                    onClick={() => updateStepStatus(index, 'error', 'Failed to complete step')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
                  >
                    ❌ Failed
                  </button>
                  <button
                    onClick={() => updateStepStatus(index, 'pending')}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors duration-200"
                  >
                    🔄 Reset
                  </button>
                </div>

                {step.result && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-gray-300 text-sm">{step.result}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {completedSteps === totalSteps && (
            <div className="mt-8 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
              <h3 className="text-green-400 font-semibold text-xl mb-2">🎉 Workflow Complete!</h3>
              <p className="text-green-300">
                All workflow steps have been completed. The Song Tagger application is fully functional!
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded transition-colors duration-200"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:opacity-50 text-white rounded transition-colors duration-200"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
