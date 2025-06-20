'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  TrashIcon, 
  PlayIcon,
  MusicalNoteIcon,
  CloudArrowUpIcon,
  TagIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Playlist } from '../types';
import { PlaylistDetail } from './playlist-detail';
import { PlaylistStats } from './playlist-stats';

interface PlaylistLibraryProps {
  userId: string;
  spotifyApi: any;
  user?: any; // Add user prop for ownership checking
}

export default function PlaylistLibrary({ userId, spotifyApi, user }: PlaylistLibraryProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'custom' | 'spotify'>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const queryClient = useQueryClient();

  // Clear notification after 5 seconds
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch user's custom playlists from our database
  const { data: customPlaylists, isLoading: isLoadingCustom } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const response = await fetch('/api/playlists');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      return response.json();
    },
  });

  // Fetch user's Spotify playlists
  const { data: spotifyPlaylists, isLoading: isLoadingSpotify, error: spotifyError } = useQuery({
    queryKey: ['spotify-playlists'],
    queryFn: async () => {
      try {
        console.log('Fetching all Spotify playlists...');
        const playlists = await spotifyApi.getUserPlaylists();
        console.log(`Spotify playlists loaded: ${playlists.items.length} playlists total`);
        return playlists;
      } catch (error) {
        console.error('Failed to fetch Spotify playlists:', error);
        throw error;
      }
    },
    enabled: !!spotifyApi,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since fetching all playlists can be slow
  });

  // Merge and sort all playlists by recently changed
  const allPlaylists = React.useMemo(() => {
    const custom = customPlaylists || [];
    const spotify = spotifyPlaylists?.items || [];
    
    // Convert Spotify playlists to consistent format
    const formattedSpotifyPlaylists = spotify.map((playlist: any) => ({
      id: `spotify-${playlist.id}`,
      spotifyId: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      userId: userId,
      songs: [], // Will be loaded when needed
      isSpotifyPlaylist: true,
      spotifyData: playlist,
      trackCount: playlist.tracks?.total || 0,
      imageUrl: playlist.images?.[0]?.url,
      owner: playlist.owner?.display_name,
      isOwned: playlist.owner?.id === user?.id, // Check if current user owns this playlist
      createdAt: new Date(0), // Spotify doesn't provide creation date
      updatedAt: new Date(0), // Will use last interaction date when available
      lastUsed: null, // Track when playlist was last accessed in our app
    }));

    // Combine all playlists
    const combined = [
      ...custom.map((playlist: any) => ({
        ...playlist,
        isSpotifyPlaylist: false,
        trackCount: playlist.songs?.length || 0,
        isOwned: true,
        lastUsed: playlist.lastUsed || playlist.updatedAt
      })),
      ...formattedSpotifyPlaylists
    ];

    // Sort by: imported/custom first, then by recently changed/used
    return combined.sort((a, b) => {
      // Imported playlists first
      if (!a.isSpotifyPlaylist && b.isSpotifyPlaylist) return -1;
      if (a.isSpotifyPlaylist && !b.isSpotifyPlaylist) return 1;
      
      // Then by last used/updated
      const aDate = a.lastUsed || a.updatedAt || new Date(0);
      const bDate = b.lastUsed || b.updatedAt || new Date(0);
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [customPlaylists, spotifyPlaylists, userId]);

  // Filter playlists based on search query and filter type
  const filteredPlaylists = React.useMemo(() => {
    let filtered = allPlaylists;
    
    // Apply type filter first
    if (searchFilter === 'custom') {
      filtered = filtered.filter(playlist => !playlist.isSpotifyPlaylist);
    } else if (searchFilter === 'spotify') {
      filtered = filtered.filter(playlist => playlist.isSpotifyPlaylist);
    }
    
    // Apply search query
    if (!playlistSearchQuery.trim()) {
      return filtered;
    }

    const query = playlistSearchQuery.toLowerCase();
    return filtered.filter(playlist => 
      playlist.name.toLowerCase().includes(query) ||
      playlist.description?.toLowerCase().includes(query) ||
      playlist.owner?.toLowerCase().includes(query)
    );
  }, [allPlaylists, playlistSearchQuery, searchFilter]);

  const isLoading = isLoadingCustom || isLoadingSpotify;

  // Create new playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlistData: { name: string; description: string }) => {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playlistData),
      });
      if (!response.ok) throw new Error('Failed to create playlist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreating(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      showNotification('success', 'Playlist created successfully!');
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete playlist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showNotification('success', 'Playlist deleted successfully!');
    },
  });

  // Import Spotify playlist mutation
  const importSpotifyPlaylistMutation = useMutation({
    mutationFn: async (spotifyPlaylistId: string) => {
      const response = await fetch('/api/playlists/import-spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotifyPlaylistId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import Spotify playlist');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showNotification('success', 'Spotify playlist imported successfully!');
    },
    onError: (error: Error) => {
      showNotification('error', `Failed to import playlist: ${error.message}`);
    },
  });

  // Sync playlist to Spotify mutation
  const syncToSpotifyMutation = useMutation({
    mutationFn: async ({ playlistId, action }: { playlistId: string; action: 'sync' | 'create' }) => {
      const response = await fetch(`/api/playlists/${playlistId}/sync-to-spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync playlist to Spotify');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showNotification('success', 'Playlist synchronized with Spotify successfully!');
    },
    onError: (error: Error) => {
      showNotification('error', `Failed to sync playlist: ${error.message}`);
    },
  });

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylistMutation.mutate({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
      });
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  const handleImportSpotifyPlaylist = (spotifyPlaylistId: string) => {
    importSpotifyPlaylistMutation.mutate(spotifyPlaylistId);
  };

  const handleSyncToSpotify = (playlistId: string, action: 'sync' | 'create' = 'sync') => {
    syncToSpotifyMutation.mutate({ playlistId, action });
  };

  const handleClearSearch = () => {
    setPlaylistSearchQuery('');
    setSearchFilter('all');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  };

  const highlightSearchText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-500/30 text-yellow-200 rounded px-1">
          {part}
        </span>
      ) : part
    );
  };

  // Show detailed view if a playlist is selected
  if (selectedPlaylist) {
    return (
      <PlaylistDetail
        playlist={selectedPlaylist}
        onBack={() => setSelectedPlaylist(null)}
        userId={userId}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Playlist Statistics */}
      {customPlaylists && customPlaylists.length > 0 && (
        <PlaylistStats playlists={customPlaylists} />
      )}

      {/* Create New Playlist Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <PlusIcon className="w-6 h-6 mr-2 text-green-400" />
          Create New Playlist
        </h3>
        
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5 inline mr-2" />
            New Playlist
          </button>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg transition-colors duration-200"
              >
                {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All Playlists - Merged View */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <MusicalNoteIcon className="w-6 h-6 mr-2 text-purple-400" />
          All Playlists
          {isLoading && (
            <div className="ml-3 w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </h3>

        {/* Search Input */}
        {allPlaylists.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search playlists..."
                className="w-full pl-9 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              {playlistSearchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title="Clear search (ESC)"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSearchFilter('all')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  searchFilter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                All ({allPlaylists.length})
              </button>
              <button
                onClick={() => setSearchFilter('custom')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  searchFilter === 'custom'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Custom ({customPlaylists?.length || 0})
              </button>
              <button
                onClick={() => setSearchFilter('spotify')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  searchFilter === 'spotify'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Spotify ({spotifyPlaylists?.items?.length || 0})
              </button>
            </div>
            
            {(playlistSearchQuery || searchFilter !== 'all') && (
              <div className="mt-2 text-sm text-gray-400">
                {filteredPlaylists.length} of {allPlaylists.length} playlists
                {playlistSearchQuery && filteredPlaylists.length === 0 && (
                  <span className="text-yellow-400"> - Try different search terms</span>
                )}
              </div>
            )}
          </div>
        )}
        
        {spotifyError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              ⚠️ Error loading Spotify playlists: {spotifyError.message}
            </p>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-gray-400 flex items-center">
            <div className="mr-3 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            {isLoadingSpotify && isLoadingCustom ? (
              'Loading all your playlists...'
            ) : isLoadingSpotify ? (
              'Loading all Spotify playlists...'
            ) : (
              'Loading custom playlists...'
            )}
          </div>
        ) : filteredPlaylists.length > 0 ? (
          <>
            <div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <p className="text-purple-400 text-sm">
                📝 {customPlaylists?.length || 0} custom playlists, {spotifyPlaylists?.items?.length || 0} Spotify playlists
                {playlistSearchQuery && (
                  <span className="block mt-1">
                    Showing {filteredPlaylists.length} matching playlist{filteredPlaylists.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaylists.map((playlist: any, index: number) => {
                const isImported = !playlist.isSpotifyPlaylist || customPlaylists?.some((cp: Playlist) => cp.spotifyId === playlist.spotifyId);
                const uniqueKey = playlist.isSpotifyPlaylist ? `spotify-${playlist.spotifyId}` : `custom-${playlist.id}`;
                return (
                  <div key={uniqueKey} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium truncate">
                            {highlightSearchText(playlist.name, playlistSearchQuery)}
                          </h4>
                          {playlist.isSpotifyPlaylist && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Spotify playlist" />
                          )}
                          {!playlist.isSpotifyPlaylist && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full" title="Custom playlist" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{playlist.trackCount} tracks</p>
                        {playlist.owner && playlist.isSpotifyPlaylist && (
                          <p className="text-gray-500 text-xs">
                            by {highlightSearchText(playlist.owner, playlistSearchQuery)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {playlist.imageUrl && (
                          <img 
                            src={playlist.imageUrl} 
                            alt={playlist.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        {!playlist.isSpotifyPlaylist && (
                          <>
                            <button
                              onClick={() => setSelectedPlaylist(playlist)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
                              title="View details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlaylist(playlist.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/20 transition-colors"
                              title="Delete playlist"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {playlist.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {highlightSearchText(playlist.description, playlistSearchQuery)}
                      </p>
                    )}
                    
                    <div className="flex flex-col space-y-2">
                      {playlist.isSpotifyPlaylist ? (
                        // Spotify playlist actions
                        <div className="flex space-x-2">
                          {isImported ? (
                            <span className="flex-1 px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm text-center">
                              Already Imported
                            </span>
                          ) : (
                            <button
                              onClick={() => handleImportSpotifyPlaylist(playlist.spotifyId)}
                              disabled={importSpotifyPlaylistMutation.isPending}
                              className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded text-sm transition-colors"
                            >
                              {importSpotifyPlaylistMutation.isPending ? 'Importing...' : 'Import & Tag'}
                            </button>
                          )}
                          {playlist.isOwned && (
                            <button
                              onClick={() => {
                                // Create a temporary playlist object for viewing Spotify playlists
                                const tempPlaylist = {
                                  ...playlist,
                                  songs: [], // Will be loaded in detail view
                                };
                                setSelectedPlaylist(tempPlaylist);
                              }}
                              className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                              title="View playlist"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        // Custom playlist actions
                        <>
                          <button
                            onClick={() => setSelectedPlaylist(playlist)}
                            className="w-full px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors duration-200"
                          >
                            View Details
                          </button>
                          
                          {/* Spotify sync controls */}
                          <div className="flex space-x-2">
                            {playlist.isSpotifyPlaylist ? (
                              <button
                                onClick={() => handleSyncToSpotify(playlist.id, 'sync')}
                                disabled={syncToSpotifyMutation.isPending}
                                className="flex-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors duration-200"
                                title="Sync changes to Spotify"
                              >
                                {syncToSpotifyMutation.isPending ? 'Syncing...' : 'Sync to Spotify'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSyncToSpotify(playlist.id, 'create')}
                                disabled={syncToSpotifyMutation.isPending}
                                className="flex-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors duration-200"
                                title="Create on Spotify"
                              >
                                {syncToSpotifyMutation.isPending ? 'Creating...' : 'Create on Spotify'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center py-8">
            {playlistSearchQuery || searchFilter !== 'all' ? (
              // No search results
              <>
                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-lg font-medium">No playlists found</p>
                <p className="text-sm mt-2">
                  {playlistSearchQuery && searchFilter !== 'all' && (
                    <>No {searchFilter} playlists match "{playlistSearchQuery}"</>
                  )}
                  {playlistSearchQuery && searchFilter === 'all' && (
                    <>No playlists match "{playlistSearchQuery}"</>
                  )}
                  {!playlistSearchQuery && searchFilter !== 'all' && (
                    <>No {searchFilter} playlists found</>
                  )}
                </p>
                <button
                  onClick={handleClearSearch}
                  className="mt-4 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                >
                  Clear filters
                </button>
              </>
            ) : (
              // No playlists at all
              <>
                <MusicalNoteIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>No playlists found.</p>
                <p className="text-sm mt-2">Create your first playlist above or import from Spotify!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
