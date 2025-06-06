'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, FunnelIcon, PlayIcon, ArrowTopRightOnSquareIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { TaggedSong, Tag } from '@/types';
import { formatDuration } from '@/lib/utils';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SongLibraryProps {
  userId: string;
}

export function SongLibrary({ userId }: SongLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');

  // Fetch user's tags for filtering
  const { data: tags = [] } = useQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const q = query(collection(db, 'tags'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
    },
  });

  // Fetch tagged songs
  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['taggedSongs', userId],
    queryFn: async () => {
      // Get all songs for the user
      const songsQuery = query(
        collection(db, 'songs'),
        where('userId', '==', userId)
        // Note: orderBy removed temporarily to avoid composite index requirement
        // Will be sorted in JavaScript below
      );
      const songsSnapshot = await getDocs(songsQuery);
      const songs = songsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaggedSong));

      // Get tags for each song
      const songsWithTags = await Promise.all(
        songs.map(async (song) => {
          const songTagsQuery = query(
            collection(db, 'songTags'),
            where('songId', '==', song.spotifyId),
            where('userId', '==', userId)
          );
          const songTagsSnapshot = await getDocs(songTagsQuery);
          const tagIds = songTagsSnapshot.docs.map(doc => doc.data().tagId);

          // Get tag details
          const songTags = tags.filter(tag => tagIds.includes(tag.id));

          return {
            ...song,
            tags: songTags,
          } as TaggedSong;
        })
      );

      // Sort songs by createdAt in JavaScript (temporary workaround)
      songsWithTags.sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });

      return songsWithTags;
    },
    enabled: !!userId, // Changed from tags.length > 0 to ensure it runs when userId exists
  });

  // Filter songs based on search and tag filter
  const filteredSongs = songs.filter(song => {
    const matchesSearch = !searchQuery || 
      song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTagFilter || 
      song.tags.some(tag => tag.id === selectedTagFilter);

    return matchesSearch && matchesTag;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your music library..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tag Filter */}
          <div className="md:w-64">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id} className="bg-gray-800">
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Your Music Library ({filteredSongs.length} songs)
          </h3>
        </div>

        {filteredSongs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {songs.length === 0 ? (
              <>
                <PlayIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No songs in your library yet</p>
                <p className="text-sm">Search for music and add tags to build your library</p>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No songs match your search</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  {/* Album Art */}
                  <div className="flex-shrink-0">
                    {song.imageUrl ? (
                      <img
                        src={song.imageUrl}
                        alt={song.album}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate">{song.name}</h4>
                    <p className="text-gray-400 truncate">{song.artist}</p>
                    <p className="text-gray-500 text-sm truncate">{song.album}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex-shrink-0 max-w-xs">
                    {song.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {song.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {song.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-700">
                            +{song.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="flex items-center space-x-2 text-gray-400">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-sm">{formatDuration(song.duration)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <a
                      href={song.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                      title="Open in Spotify"
                    >
                      <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>

                    {song.previewUrl && (
                      <button
                        onClick={() => {
                          const audio = new Audio(song.previewUrl!);
                          audio.play();
                        }}
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                        title="Play preview"
                      >
                        <PlayIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
