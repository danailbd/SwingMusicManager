'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon,
  TagIcon,
  MusicalNoteIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  HomeIcon,
  ListBulletIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SpotifyAPI } from '@/lib/spotify';
import { useAppStatePersistence, type ActiveView } from '@/lib/use-app-state-persistence';
import { SearchResults } from './search-results';
import { TagManager } from './tag-manager';
import PlaylistLibrary from './playlist-library';
import { SongLibrary } from './song-library';
import { RecentSongs } from './recent-songs';
import { MusicPlayer } from './music-player';
import { SpotifyPlayer } from './spotify-player';
import { useMusicPlayer } from './music-player-context';
import { AppStateDebugger } from './app-state-debugger';
import { PersistenceSettings } from './persistence-settings';

interface DashboardProps {
  user: any;
  accessToken: string;
}

export default function Dashboard({ user, accessToken }: DashboardProps) {
  // All hooks must be called in the same order every time
  const {
    appState,
    isLoaded,
    updateActiveView,
    updateSearchQuery,
    clearState
  } = useAppStatePersistence();
  
  const [searchQuery, setSearchQueryState] = useState('');
  const [spotifyApi] = useState(() => new SpotifyAPI(accessToken));
  const [showPersistenceSettings, setShowPersistenceSettings] = useState(false);
  
  // Always call useMusicPlayer hook, regardless of loading state
  const { currentSong, queue, isPlayerVisible, nextSong, previousSong } = useMusicPlayer();

  // Initialize state from persistence when loaded
  useEffect(() => {
    if (isLoaded && appState) {
      setSearchQueryState(appState.searchQuery || '');
    }
  }, [isLoaded, appState]);

  // Auto-resume functionality for returning users
  useEffect(() => {
    if (!isLoaded || !appState) return; // Early return to avoid unnecessary work
    
    if (appState.currentSong && appState.isPlayerVisible) {
      const resumePlayback = async () => {
        console.log('Attempting to resume playback:', appState.currentSong?.name);
        
        // Only auto-resume if we have a recently played song (within last hour)
        const timeSinceUpdate = Date.now() - appState.lastUpdated;
        const oneHour = 60 * 60 * 1000;
        
        if (timeSinceUpdate < oneHour && appState.currentSong) {
          // If user had a song playing recently, show player but don't auto-play
          // User can manually resume if they want
          console.log('Restoring player state without auto-playing');
        }
      };
      
      // Small delay to let other components initialize
      setTimeout(resumePlayback, 1000);
    }
  }, [isLoaded, appState]);

  // Update search query with persistence
  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    updateSearchQuery(query);
  };

  // Update active view with persistence
  const setActiveView = (view: ActiveView) => {
    updateActiveView(view);
  };

  const handleLogout = async () => {
    clearState(); // Clear persisted state on logout
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const navigation = [
    { id: 'search', label: 'Search', icon: MagnifyingGlassIcon },
    { id: 'library', label: 'My Library', icon: MusicalNoteIcon },
    { id: 'recent', label: 'Recent Songs', icon: ClockIcon },
    { id: 'tags', label: 'Tags', icon: TagIcon },
    { id: 'playlists', label: 'Playlists', icon: ListBulletIcon },
  ];

  // Show loading state while app state is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <MusicalNoteIcon className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Song Tagger</h2>
          <p className="text-gray-400">Restoring your previous session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <MusicalNoteIcon className="w-8 h-8 text-green-400" />
              <h1 className="text-xl font-bold text-white">Song Tagger</h1>
            </div>

            {/* User Info */}
            <div className="mb-8 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
              <div className="flex items-center space-x-3">
                {user.images?.[0] && (
                  <img 
                    src={user.images[0].url} 
                    alt={user.display_name}
                    className="w-12 h-12 rounded-full border-2 border-green-400"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{user.display_name}</p>
                  <p className="text-gray-300 text-sm truncate">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-400 font-medium text-sm">🎵 Connected to Spotify</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = appState?.activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      console.log('Navigation clicked:', item.id);
                      setActiveView(item.id as ActiveView);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 cursor-pointer'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-6 border-t border-white/10 space-y-2">
            <button
              onClick={() => setShowPersistenceSettings(true)}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors duration-200"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>App Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-black/10 backdrop-blur-md border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-white capitalize">
                  {appState?.activeView === 'search' && 'Search Music'}
                  {appState?.activeView === 'library' && 'My Library'}
                  {appState?.activeView === 'recent' && 'Recent Songs'}
                  {appState?.activeView === 'tags' && 'Manage Tags'}
                  {appState?.activeView === 'playlists' && 'My Playlists'}
                </h2>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">Spotify Connected</span>
                </div>
              </div>
              
              {appState?.activeView === 'search' && (
                <div className="flex-1 max-w-md mx-8">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for songs, artists, or albums..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MusicalNoteIcon className="w-12 h-12 text-green-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-400">Loading your content...</p>
                </div>
              </div>
            ) : (
              <>
                {appState?.activeView === 'search' && (
                  <SearchResults 
                    query={searchQuery} 
                    spotifyApi={spotifyApi}
                    userId={user.id}
                  />
                )}
                {appState?.activeView === 'library' && (
                  <SongLibrary userId={user.id} />
                )}
                {appState?.activeView === 'recent' && (
                  <RecentSongs userId={user.id} />
                )}
                {appState?.activeView === 'tags' && (
                  <TagManager userId={user.id} />
                )}
                {appState?.activeView === 'playlists' && (
                  <PlaylistLibrary 
                    userId={user.id}
                    spotifyApi={spotifyApi}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Music Player */}
      {isPlayerVisible && currentSong && (
        <MusicPlayer
          currentSong={currentSong}
          queue={queue}
          onNext={nextSong}
          onPrevious={previousSong}
        />
      )}

      {/* Spotify Web Playback SDK */}
      <SpotifyPlayer accessToken={accessToken} />

      {/* App State Debugger (Development only) */}
      {process.env.NODE_ENV === 'development' && <AppStateDebugger />}

      {/* Persistence Settings Modal */}
      <PersistenceSettings 
        isOpen={showPersistenceSettings} 
        onClose={() => setShowPersistenceSettings(false)} 
      />
    </div>
  );
}
