'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlayIcon, PlusIcon, TagIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { SpotifyAPI } from '@/lib/spotify';
import { SpotifyTrack, Tag } from '@/types';
import { formatDuration } from '@/lib/utils';
import { TagSelector } from './tag-selector';
import { useMusicPlayer } from './music-player-context';
import SongDetails from './song-details';
import { 
  collection, 
  query as firestoreQuery, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchResultsProps {
  query: string;
  spotifyApi: SpotifyAPI;
  userId: string;
}

interface SpotifyTrackWithTags extends SpotifyTrack {
  tags?: Tag[];
}

export function SearchResults({ query, spotifyApi, userId }: SearchResultsProps) {
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showSongDetails, setShowSongDetails] = useState(false);
  const { playSong, currentSong, isSpotifyReady } = useMusicPlayer();

  // Fetch user's tags for reference
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const q = firestoreQuery(collection(db, 'tags'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
    },
  });

  // Function to fetch tags for a specific track
  const fetchTrackTags = async (trackId: string): Promise<Tag[]> => {
    try {
      const q = firestoreQuery(
        collection(db, 'songTags'),
        where('songId', '==', trackId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const tagIds = snapshot.docs.map(doc => (doc.data() as any).tagId);
      
      return allTags.filter(tag => tagIds.includes(tag.id));
    } catch (error) {
      console.error('Error fetching track tags:', error);
      return [];
    }
  };

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => spotifyApi.searchTracks(query),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch tracks with their tags
  const { data: tracksWithTags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['search-tracks-with-tags', userId, searchResults?.tracks?.items?.length],
    queryFn: async () => {
      if (!searchResults?.tracks?.items || !allTags.length) return [];
      
      const tracksWithTags = await Promise.all(
        searchResults.tracks.items.map(async (track: SpotifyTrack) => {
          const tags = await fetchTrackTags(track.id);
          return { ...track, tags } as SpotifyTrackWithTags;
        })
      );
      
      return tracksWithTags;
    },
    enabled: !!searchResults?.tracks?.items && allTags.length > 0,
  });

  const handleTagTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setShowTagSelector(true);
  };

  // Convert SpotifyTrack to TaggedSong format for music player
  const convertToTaggedSong = (track: SpotifyTrack): any => ({
    id: track.id,
    spotifyId: track.id,
    name: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url || '',
    duration: track.duration_ms,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls.spotify,
    uri: track.uri,
    userId: userId,
    tags: (track as any).tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleSongClick = (track: SpotifyTrack) => {
    const convertedSong = convertToTaggedSong(track);
    setSelectedSong(convertedSong);
    setShowSongDetails(true);
  };

  if (!query) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <PlayIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Start typing to search for music</p>
          <p className="text-sm">Search for songs, artists, or albums from Spotify</p>
        </div>
      </div>
    );
  }

  if (query.length <= 2) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <p>Type at least 3 characters to search</p>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingTags) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p className="text-lg">Error searching for music</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  const tracks = tracksWithTags.length > 0 ? tracksWithTags : (searchResults?.tracks?.items || []);

  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <p className="text-lg">No results found</p>
          <p className="text-sm">Try searching with different keywords</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tracks.map((track: SpotifyTrack) => (
          <div
            key={track.id}
            className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
            onClick={() => handleSongClick(track)}
          >
            <div className="flex items-center space-x-4">
              {/* Album Art */}
              <div className="flex-shrink-0">
                {track.album.images[0] ? (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    <PlayIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{track.name}</h3>
                <p className="text-gray-400 truncate">
                  {track.artists.map(artist => artist.name).join(', ')}
                </p>
                <p className="text-gray-500 text-sm truncate">{track.album.name}</p>
                
                {/* Tags */}
                {(track as any).tags && (track as any).tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(track as any).tags.slice(0, 2).map((tag: Tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {(track as any).tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-700">
                        +{(track as any).tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="flex items-center space-x-2 text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm">{formatDuration(track.duration_ms)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTagTrack(track);
                  }}
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                  title="Add tags"
                >
                  <TagIcon className="w-5 h-5" />
                </button>
                
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                  title="Open in Spotify"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </a>

                {(isSpotifyReady && track.uri) || track.preview_url ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const taggedSong = convertToTaggedSong(track);
                      const allTaggedSongs = tracks
                        .filter((t: SpotifyTrack) => (isSpotifyReady && t.uri) || t.preview_url)
                        .map(convertToTaggedSong);
                      playSong(taggedSong, allTaggedSongs);
                    }}
                    className={`p-2 transition-colors duration-200 rounded-lg relative ${
                      currentSong?.spotifyId === track.id 
                        ? 'text-green-400 bg-green-500/20' 
                        : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                    }`}
                    title={isSpotifyReady && track.uri ? "Play full song via Spotify" : "Play 30-second preview"}
                  >
                    <PlayIcon className="w-5 h-5" />
                    {isSpotifyReady && track.uri && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
                    )}
                  </button>
                ) : (
                  <div className="p-2 text-gray-600" title="No preview available">
                    <PlayIcon className="w-5 h-5 opacity-30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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

      {/* Song Details Modal */}
      <SongDetails
        song={selectedSong}
        isOpen={showSongDetails}
        onClose={() => {
          setShowSongDetails(false);
          setSelectedSong(null);
        }}
      />
    </>
  );
}
