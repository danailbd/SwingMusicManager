'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  PlusIcon, 
  ClockIcon, 
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { SpotifyTrack, Tag } from '@/types';
import { formatDuration } from '@/lib/utils';
import { TagSelector } from './tag-selector';
import { useMusicPlayer } from './music-player-context';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RecentSongsProps {
  userId: string;
}

interface RecentTrack extends SpotifyTrack {
  played_at: string;
  tags?: Tag[];
}

export function RecentSongs({ userId }: RecentSongsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<RecentTrack | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const { playSong, currentSong, playPlaylist, isSpotifyReady } = useMusicPlayer();

  // Convert SpotifyTrack to TaggedSong format for music player
  const convertToTaggedSong = (track: RecentTrack) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((artist: any) => artist.name).join(', '),
    album: track.album.name,
    duration: track.duration_ms,
    previewUrl: track.preview_url,
    albumArt: track.album?.images?.[0]?.url || null,
    spotifyUrl: track.external_urls.spotify,
    tags: track.tags || []
  });

  // Fetch user's tags for reference
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const q = query(collection(db, 'tags'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
    },
  });

  // Function to fetch tags for a specific track
  const fetchTrackTags = async (trackId: string): Promise<Tag[]> => {
    try {
      const q = query(
        collection(db, 'songTags'),
        where('songId', '==', trackId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const tagIds = snapshot.docs.map(doc => doc.data().tagId);
      
      return allTags.filter(tag => tagIds.includes(tag.id));
    } catch (error) {
      console.error('Error fetching track tags:', error);
      return [];
    }
  };

  // Fetch recent songs from API
  const { data: recentData, isLoading, error } = useQuery({
    queryKey: ['recent-songs'],
    queryFn: async () => {
      const response = await fetch('/api/recent-songs');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch recent songs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for debugging
  });

  // Fetch tracks with their tags
  const { data: tracksWithTags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['recent-songs-with-tags', userId, recentData?.tracks?.length],
    queryFn: async () => {
      if (!recentData?.tracks || !allTags.length) return [];
      
      const tracksWithTags = await Promise.all(
        recentData.tracks.map(async (track: RecentTrack) => {
          const tags = await fetchTrackTags(track.id);
          return { ...track, tags };
        })
      );
      
      return tracksWithTags;
    },
    enabled: !!recentData?.tracks && allTags.length > 0,
  });

  const recentTracks = tracksWithTags.length > 0 ? tracksWithTags : (recentData?.tracks || []);

  // Filter tracks based on search query
  const filteredTracks = recentTracks.filter((track: RecentTrack) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      track.name.toLowerCase().includes(query) ||
      track.artists.some((artist: any) => artist.name.toLowerCase().includes(query)) ||
      track.album.name.toLowerCase().includes(query)
    );
  });

  // Remove duplicates based on track ID, keeping the most recent play
  const uniqueTracks = filteredTracks.reduce((acc: RecentTrack[], track: RecentTrack) => {
    const existingIndex = acc.findIndex(t => t.id === track.id);
    if (existingIndex === -1) {
      acc.push(track);
    } else if (new Date(track.played_at) > new Date(acc[existingIndex].played_at)) {
      acc[existingIndex] = track;
    }
    return acc;
  }, []);

  // Sort by played_at (most recent first)
  const sortedTracks = uniqueTracks.sort((a: RecentTrack, b: RecentTrack) => 
    new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );

  const handleTagTrack = (track: RecentTrack) => {
    setSelectedTrack(track);
    setShowTagSelector(true);
  };

  const formatPlayedAt = (playedAt: string) => {
    const date = new Date(playedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  if (isLoading || isLoadingTags) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <CalendarDaysIcon className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Recent Songs</h2>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-red-400 font-semibold mb-2">Failed to load recent songs</h3>
          <p className="text-red-300 text-sm mb-4">{error.message}</p>
          <div className="space-y-2 text-sm text-red-200">
            <p>This might be because:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You need to re-authenticate with Spotify to grant access to recent tracks</li>
              <li>You haven't played any music recently on Spotify</li>
              <li>Your Spotify account doesn't have the required permissions</li>
            </ul>
            <div className="mt-4">
              <button
                onClick={() => window.location.href = '/api/auth/logout'}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Re-authenticate with Spotify
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <CalendarDaysIcon className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Recent Songs</h2>
        </div>
        
        <div className="mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your recent songs..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Recent Songs List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {searchQuery ? `Search Results (${sortedTracks.length})` : `Recently Played (${sortedTracks.length})`}
          </h3>
          
          {sortedTracks.length > 0 && (
            <button
              onClick={() => {
                const playlist = sortedTracks.map(convertToTaggedSong);
                playPlaylist(playlist, 0);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Play All</span>
            </button>
          )}
        </div>

        {sortedTracks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchQuery ? (
              <>
                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No songs match your search</p>
                <p className="text-sm">Try different search terms</p>
              </>
            ) : (
              <>
                <CalendarDaysIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No recent songs found</p>
                <p className="text-sm">Start playing music on Spotify to see your recent tracks here</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTracks.map((track: RecentTrack) => (
              <div
                key={`${track.id}-${track.played_at}`}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  {/* Album Art */}
                  <div className="flex-shrink-0">
                    {track.album?.images?.[0]?.url ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.album.name}
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
                    <h4 className="text-white font-medium truncate">{track.name}</h4>
                    <p className="text-gray-400 text-sm truncate">
                      {track.artists.map((artist: any) => artist.name).join(', ')}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{track.album.name}</p>
                    
                    {/* Tags */}
                    {track.tags && track.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {track.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {track.tags.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-700">
                            +{track.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Played At */}
                  <div className="flex items-center space-x-1 text-gray-400 text-xs">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatPlayedAt(track.played_at)}</span>
                  </div>

                  {/* Duration */}
                  <div className="text-gray-400 text-xs">
                    {formatDuration(track.duration_ms)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTagTrack(track)}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                      title="Add tags to this song"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>

                    <a
                      href={track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                      title="Open in Spotify"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>

                    {(isSpotifyReady && track.uri) || track.preview_url ? (
                      <button
                        onClick={() => {
                          const playlist = sortedTracks
                            .filter((t: RecentTrack) => (isSpotifyReady && t.uri) || t.preview_url)
                            .map(convertToTaggedSong);
                          const currentIndex = playlist.findIndex((song: any) => song.id === track.id);
                          playPlaylist(playlist, Math.max(0, currentIndex));
                        }}
                        className={`p-2 rounded-lg transition-colors duration-200 relative ${
                          currentSong?.id === track.id
                            ? 'text-green-400 bg-green-500/20'
                            : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                        title={isSpotifyReady && track.uri ? "Play full song via Spotify" : "Play 30-second preview"}
                      >
                        <PlayIcon className="w-4 h-4" />
                        {isSpotifyReady && track.uri && (
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
            ))}
          </div>
        )}
      </div>

      {/* Tag Selector Modal */}
      {showTagSelector && selectedTrack && (
        <TagSelector
          track={selectedTrack}
          userId={userId}
          onClose={() => {
            setShowTagSelector(false);
            setSelectedTrack(null);
          }}
        />
      )}
    </div>
  );
}
