'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PlayIcon,
  PlusIcon,
  ClockIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Playlist, TaggedSong } from '../types';
import { formatDuration } from '../lib/utils';
import { useMusicPlayer } from './music-player-context';
import SongDetails from './song-details';
import { TagSelector } from './tag-selector';

interface PlaylistDetailProps {
  playlist: Playlist;
  onBack: () => void;
  userId: string;
}

// Sortable Item Component
interface SortableItemProps {
  song: TaggedSong;
  index: number;
  onSongClick: (song: TaggedSong) => void;
  onPlaySong: (song: TaggedSong) => void;
  onTagSong: (song: TaggedSong) => void;
  currentSong: TaggedSong | null;
  isSpotifyReady: boolean;
}

function SortableItem({ song, index, onSongClick, onPlaySong, onTagSong, currentSong, isSpotifyReady }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
      onClick={() => onSongClick(song)}
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Bars3Icon className="w-4 h-4" />
        </div>

        {/* Track Number */}
        <div className="w-8 text-center text-gray-400 text-sm">
          {index + 1}
        </div>

        {/* Album Art */}
        <div className="flex-shrink-0">
          {song.imageUrl ? (
            <img
              src={song.imageUrl}
              alt={song.album}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">{song.name}</h4>
          <p className="text-gray-400 text-sm truncate">{song.artist}</p>
          <p className="text-gray-500 text-xs truncate">{song.album}</p>
          
          {/* Tags */}
          {song.tags && song.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {song.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {song.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-700">
                  +{song.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="text-gray-400 text-xs">
          {formatDuration(song.duration)}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTagSong(song);
            }}
            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors duration-200"
            title="Add tags"
          >
            <TagIcon className="w-4 h-4" />
          </button>

          <a
            href={song.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
            title="Open in Spotify"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>

          {(isSpotifyReady && song.uri) || song.previewUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlaySong(song);
              }}
              className={`p-2 rounded-lg transition-colors duration-200 relative ${
                currentSong?.id === song.id
                  ? 'text-green-400 bg-green-500/20'
                  : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
              }`}
              title={isSpotifyReady && song.uri ? "Play full song via Spotify" : "Play 30-second preview"}
            >
              <PlayIcon className="w-4 h-4" />
              {isSpotifyReady && song.uri && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
              )}
            </button>
          ) : (
            <div className="p-2 text-gray-600" title="No preview available">
              <PlayIcon className="w-4 h-4 opacity-30" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlaylistDetail({ playlist, onBack, userId }: PlaylistDetailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedSong, setSelectedSong] = useState<TaggedSong | null>(null);
  const [showSongDetails, setShowSongDetails] = useState(false);
  const [selectedTrackForTagging, setSelectedTrackForTagging] = useState<any>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [songs, setSongs] = useState<TaggedSong[]>(playlist.songs || []);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const { playSong, currentSong, isSpotifyReady } = useMusicPlayer();
  const queryClient = useQueryClient();

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Clear notification after 5 seconds
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Sync to Spotify mutation
  const syncToSpotifyMutation = useMutation({
    mutationFn: async ({ action }: { action: 'sync' | 'create' }) => {
      const response = await fetch(`/api/playlists/${playlist.id}/sync-to-spotify`, {
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
      showNotification('success', `Playlist ${playlist.name} synced to Spotify`);
    },
    onError: (error: Error) => {
      showNotification('error', error.message);
    },
  });

  const handleSyncToSpotify = (action: 'sync' | 'create' = 'sync') => {
    syncToSpotifyMutation.mutate({ action });
  };

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async (updatedSongs: TaggedSong[]) => {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songs: updatedSongs }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update playlist');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showNotification('success', 'Playlist order updated successfully');
    },
    onError: (error: Error) => {
      showNotification('error', error.message);
      // Reset to original order on error
      setSongs(playlist.songs || []);
    },
  });

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = songs.findIndex((song) => song.id === active.id);
      const newIndex = songs.findIndex((song) => song.id === over.id);

      const newSongs = arrayMove(songs, oldIndex, newIndex);
      setSongs(newSongs);
      updatePlaylistMutation.mutate(newSongs);
    }
  }

  // Get all unique tags from the playlist songs
  const allTags = Array.from(
    new Set(
      songs
        ?.flatMap(song => song.tags || [])
        .map(tag => tag.id)
    )
  ).map(tagId => 
    songs
      ?.flatMap(song => song.tags || [])
      .find(tag => tag.id === tagId)
  ).filter((tag): tag is NonNullable<typeof tag> => tag != null);

  // Convert TaggedSong to music player format
  const convertSongForPlayer = (song: TaggedSong) => ({
    ...song,
    // Ensure all required fields are present
    spotifyId: song.spotifyId || song.id,
    imageUrl: song.imageUrl || '',
    uri: song.uri || '',
  });

  const handlePlaySong = (song: TaggedSong) => {
    const convertedSongs = songs.map(convertSongForPlayer);
    const convertedSong = convertSongForPlayer(song);
    playSong(convertedSong, convertedSongs);
  };

  const handlePlayPlaylist = () => {
    if (songs.length > 0) {
      const convertedSongs = songs.map(convertSongForPlayer);
      playSong(convertedSongs[0], convertedSongs);
    }
  };

  const handleSongClick = (song: TaggedSong) => {
    setSelectedSong(song);
    setShowSongDetails(true);
  };

  const playableSongs = songs.filter(song => 
    (isSpotifyReady && song.uri) || song.previewUrl
  );

  // Filter songs based on search query and selected tag
  const filteredSongs = songs.filter(song => {
    const matchesSearch = !searchQuery || (
      song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.tags?.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const matchesTag = !selectedTag || song.tags?.some(tag => tag.id === selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Back to playlists"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
              {playlist.isSpotifyPlaylist && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-400 text-sm">Spotify</span>
                </div>
              )}
            </div>
            {playlist.description && (
              <p className="text-gray-400 mt-1">{playlist.description}</p>
            )}
          </div>
          
          {/* Spotify Sync Controls */}
          <div className="flex items-center space-x-2">
            {playlist.isSpotifyPlaylist ? (
              <button
                onClick={() => handleSyncToSpotify('sync')}
                disabled={syncToSpotifyMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors duration-200"
                title="Sync changes to Spotify"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                <span>{syncToSpotifyMutation.isPending ? 'Syncing...' : 'Sync to Spotify'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleSyncToSpotify('create')}
                disabled={syncToSpotifyMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors duration-200"
                title="Create playlist on Spotify"
              >
                <PlusIcon className="w-4 h-4" />
                <span>{syncToSpotifyMutation.isPending ? 'Creating...' : 'Create on Spotify'}</span>
              </button>
            )}
            
            {playlist.spotifyId && (
              <a
                href={`https://open.spotify.com/playlist/${playlist.spotifyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-green-400 hover:text-green-300 rounded-lg hover:bg-green-500/20 transition-colors"
                title="Open in Spotify"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>
              {searchQuery 
                ? `${filteredSongs.length} of ${songs?.length || 0} songs` 
                : `${songs?.length || 0} songs`
              }
            </span>
            {playlist.spotifyId && (
              <span className="text-green-400">• Synced to Spotify</span>
            )}
            <span>• Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
          </div>

          {playableSongs.length > 0 && (
            <div className="flex items-center space-x-2">
              {searchQuery && filteredSongs.length > 0 && (
                <button
                  onClick={() => {
                    if (filteredSongs.length > 0) {
                      const convertedSongs = filteredSongs.map(convertSongForPlayer);
                      playSong(convertedSongs[0], convertedSongs);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors duration-200 flex items-center space-x-1"
                >
                  <PlayIcon className="w-3 h-3" />
                  <span>Play Filtered</span>
                </button>
              )}
              <button
                onClick={handlePlayPlaylist}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Play Playlist</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Songs</h2>
          
          {/* Search and Filter Controls */}
          {songs && songs.length > 0 && (
            <div className="flex items-center space-x-3">
              {/* Tag Filter */}
              {allTags.length > 0 && (
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag.id} value={tag.id} className="bg-gray-800">
                      {tag.name}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Search Input */}
              <div className="relative w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Indicator */}
        {(searchQuery || selectedTag) && (
          <div className="mb-4 flex items-center space-x-2">
            <span className="text-sm text-gray-400">Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-blue-300 hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Tag: {allTags.find(tag => tag.id === selectedTag)?.name}
                <button
                  onClick={() => setSelectedTag('')}
                  className="ml-1 text-purple-300 hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
        
        {!songs || songs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No songs in this playlist</p>
            <p className="text-sm">Add songs to get started</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No songs match your search</p>
            <p className="text-sm">Try different search terms</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={songs.map(song => song.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {(searchQuery || selectedTag ? filteredSongs : songs).map((song, index) => {
                  const actualIndex = songs.findIndex(s => s.id === song.id);
                  return (
                    <SortableItem
                      key={song.id}
                      song={song}
                      index={actualIndex}
                      onSongClick={handleSongClick}
                      onPlaySong={handlePlaySong}
                      onTagSong={(song) => {
                        setSelectedTrackForTagging(song);
                        setShowTagSelector(true);
                      }}
                      currentSong={currentSong}
                      isSpotifyReady={isSpotifyReady}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 max-w-sm w-full p-4 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m2-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setNotification(null)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Details Modal */}
      <SongDetails
        song={selectedSong}
        isOpen={showSongDetails}
        onClose={() => {
          setShowSongDetails(false);
          setSelectedSong(null);
        }}
      />

      {/* Tag Selector Modal */}
      {showTagSelector && selectedTrackForTagging && (
        <TagSelector
          track={selectedTrackForTagging}
          userId={userId}
          onClose={() => {
            setShowTagSelector(false);
            setSelectedTrackForTagging(null);
          }}
        />
      )}
    </div>
  );
}
