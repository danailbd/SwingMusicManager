'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PlayIcon,
  XMarkIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { Playlist, TaggedSong, Tag } from '../types';

interface PlaylistManagerProps {
  selectedSongs: TaggedSong[];
  availableTags: Tag[];
  onClose: () => void;
}

export default function PlaylistManager({ selectedSongs, availableTags, onClose }: PlaylistManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: async (): Promise<Playlist[]> => {
      const response = await fetch('/api/playlists');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      return response.json();
    }
  });

  // Create new playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlistData: { name: string; description: string; songs: TaggedSong[] }) => {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistData)
      });
      if (!response.ok) throw new Error('Failed to create playlist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreating(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    }
  });

  // Add songs to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, songs }: { playlistId: string; songs: TaggedSong[] }) => {
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs })
      });
      if (!response.ok) throw new Error('Failed to add songs to playlist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setSelectedPlaylist(null);
    }
  });

  // Sync playlist to Spotify mutation
  const syncToSpotifyMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const response = await fetch(`/api/playlists/${playlistId}/sync`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to sync playlist to Spotify');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete playlist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  });

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylistMutation.mutate({
        name: newPlaylistName,
        description: newPlaylistDescription,
        songs: selectedSongs
      });
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addToPlaylistMutation.mutate({ playlistId, songs: selectedSongs });
  };

  const handleSyncToSpotify = (playlistId: string) => {
    syncToSpotifyMutation.mutate(playlistId);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-2">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Manage Playlists
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {selectedSongs.length > 0 && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700 mb-2">
                      Selected {selectedSongs.length} song{selectedSongs.length > 1 ? 's' : ''}:
                    </p>
                    <div className="max-h-20 overflow-y-auto">
                      {selectedSongs.map((song) => (
                        <div key={song.id} className="text-xs text-purple-600">
                          {song.name} - {song.artist}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create New Playlist */}
                <div className="mb-6">
                  {!isCreating ? (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:text-purple-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create New Playlist
                    </button>
                  ) : (
                    <div className="border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Create New Playlist</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Playlist name"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={newPlaylistDescription}
                          onChange={(e) => setNewPlaylistDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCreatePlaylist}
                            disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
                          </button>
                          <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Playlists */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Your Playlists</h4>
                  {!playlists || playlists.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MusicalNoteIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No playlists yet. Create your first one!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{playlist.name}</h5>
                              {playlist.description && (
                                <p className="text-sm text-gray-600 mt-1">{playlist.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {playlist.songs?.length || 0} songs
                                {playlist.spotifyId && (
                                  <span className="ml-2 text-green-600">• Synced to Spotify</span>
                                )}
                              </p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              {selectedSongs.length > 0 && (
                                <button
                                  onClick={() => handleAddToPlaylist(playlist.id)}
                                  disabled={addToPlaylistMutation.isPending}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                                  title="Add selected songs"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleSyncToSpotify(playlist.id)}
                                disabled={syncToSpotifyMutation.isPending}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                                title="Sync to Spotify"
                              >
                                <PlayIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePlaylist(playlist.id)}
                                disabled={deletePlaylistMutation.isPending}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                title="Delete playlist"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
