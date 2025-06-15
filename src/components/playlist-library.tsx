'use client';

import { useState } from 'react';
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
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Playlist } from '../types';
import { PlaylistDetail } from './playlist-detail';
import { PlaylistStats } from './playlist-stats';

interface PlaylistLibraryProps {
  userId: string;
  spotifyApi: any;
}

export default function PlaylistLibrary({ userId, spotifyApi }: PlaylistLibraryProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
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
        console.log('Fetching Spotify playlists...');
        const playlists = await spotifyApi.getUserPlaylists();
        console.log('Spotify playlists loaded:', playlists);
        return playlists;
      } catch (error) {
        console.error('Failed to fetch Spotify playlists:', error);
        throw error;
      }
    },
    enabled: !!spotifyApi,
    retry: 2,
  });

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

  const isLoading = isLoadingCustom || isLoadingSpotify;

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

      {/* Spotify Playlists Import */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CloudArrowUpIcon className="w-6 h-6 mr-2 text-green-400" />
          Import from Spotify
        </h3>
        
        {spotifyError ? (
          <div className="text-red-400 mb-4">
            Failed to load Spotify playlists. Please check your connection.
          </div>
        ) : isLoadingSpotify ? (
          <div className="text-gray-400">Loading your Spotify playlists...</div>
        ) : spotifyPlaylists?.items?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spotifyPlaylists.items.map((playlist: any) => {
              const isImported = customPlaylists?.some((cp: Playlist) => cp.spotifyId === playlist.id);
              return (
                <div key={playlist.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium truncate">{playlist.name}</h4>
                      <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                      {playlist.owner && (
                        <p className="text-gray-500 text-xs">by {playlist.owner.display_name}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {playlist.images?.[0]?.url && (
                        <img 
                          src={playlist.images[0].url} 
                          alt={playlist.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Spotify playlist" />
                    </div>
                  </div>
                  
                  {playlist.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{playlist.description}</p>
                  )}
                  
                  <div className="flex space-x-2">
                    {isImported ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                        Already Imported
                      </span>
                    ) : (
                      <button
                        onClick={() => handleImportSpotifyPlaylist(playlist.id)}
                        disabled={importSpotifyPlaylistMutation.isPending}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded text-sm transition-colors"
                      >
                        {importSpotifyPlaylistMutation.isPending ? 'Importing...' : 'Import & Tag'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-400">No Spotify playlists found.</div>
        )}
      </div>

      {/* Your Tagged Playlists */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <TagIcon className="w-6 h-6 mr-2 text-purple-400" />
          Your Tagged Playlists
        </h3>
        
        {isLoadingCustom ? (
          <div className="text-gray-400">Loading your playlists...</div>
        ) : customPlaylists?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customPlaylists.map((playlist: Playlist) => (
              <div key={playlist.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-white font-medium truncate">{playlist.name}</h4>
                      {playlist.isSpotifyPlaylist && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Synced with Spotify" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{playlist.songs?.length || 0} songs</p>
                  </div>
                  <div className="flex items-center space-x-1">
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
                  </div>
                </div>
                {playlist.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{playlist.description}</p>
                )}
                
                <div className="flex flex-col space-y-2">
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            <MusicalNoteIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p>No custom playlists yet. Create your first playlist above!</p>
          </div>
        )}
      </div>

      {/* Spotify Playlists */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CloudArrowUpIcon className="w-6 h-6 mr-2 text-green-400" />
          Your Spotify Playlists
          {isLoadingSpotify && (
            <div className="ml-3 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </h3>
        
        {spotifyError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              ⚠️ Error loading Spotify playlists: {spotifyError.message}
            </p>
          </div>
        )}
        
        {isLoadingSpotify ? (
          <div className="text-gray-400 flex items-center">
            <div className="mr-3 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Loading your Spotify playlists...
          </div>
        ) : spotifyPlaylists?.items?.length > 0 ? (
          <>
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ Successfully loaded {spotifyPlaylists.items.length} playlists from your Spotify account
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotifyPlaylists.items.map((playlist: any) => (
                <div key={playlist.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-start space-x-3">
                    {playlist.images?.[0] && (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{playlist.name}</h4>
                      <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                      <p className="text-gray-400 text-xs">by {playlist.owner.display_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      console.log('Import playlist clicked:', playlist.name);
                      alert(`Import feature for "${playlist.name}" coming soon!`);
                    }}
                    className="mt-3 w-full px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors duration-200"
                  >
                    Import & Tag Songs
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center py-8">
            <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p>No Spotify playlists found.</p>
            <p className="text-sm mt-2">Make sure you have playlists in your Spotify account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
