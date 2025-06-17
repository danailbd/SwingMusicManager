/**
 * Song Details Component
 * 
 * Provides a detailed view of a song including:
 * - All tags associated with the song
 * - All playlists containing the song
 * - Bookmarks for different time positions
 * - Ability to play from bookmarks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  PlayIcon,
  PlusIcon,
  BookmarkIcon,
  ClockIcon,
  TagIcon,
  QueueListIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { TaggedSong, Tag, Playlist, SongBookmark } from '@/types';
import { formatDuration } from '@/lib/utils';
import { useMusicPlayer } from './music-player-context';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SongDetailsProps {
  song: TaggedSong | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SongDetails({ song, isOpen, onClose }: SongDetailsProps) {
  const [bookmarks, setBookmarks] = useState<SongBookmark[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    timeInSeconds: 0,
    label: '',
    description: ''
  });
  const [editingBookmark, setEditingBookmark] = useState<SongBookmark | null>(null);

  const { playSong, currentSong, seekToTime } = useMusicPlayer();

  // Function to refresh bookmarks in both local state and music player context
  const refreshBookmarks = useCallback(async () => {
    if (!song) return;
    
    try {
      const bookmarksQuery = query(
        collection(db, 'bookmarks'),
        where('songId', '==', song.spotifyId),
        where('userId', '==', song.userId),
        orderBy('timeInSeconds', 'asc')
      );
      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      const loadedBookmarks = bookmarksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SongBookmark));
      setBookmarks(loadedBookmarks);
      
      // If this is the currently playing song, also update the music player context
      if (currentSong && currentSong.spotifyId === song.spotifyId) {
        // The music player context will automatically refresh when setCurrentSong is called
        // but we need to trigger a refresh of the bookmarks there too
        window.dispatchEvent(new CustomEvent('refreshBookmarks'));
      }
    } catch (error) {
      console.error('Error refreshing bookmarks:', error);
    }
  }, [song, currentSong]);

  // Load song data when song changes
  useEffect(() => {
    if (song && isOpen) {
      loadSongData();
    }
  }, [song, isOpen]);

  const loadSongData = async () => {
    if (!song) return;
    
    setIsLoading(true);
    try {
      await refreshBookmarks();

      // Load playlists containing this song (mock data for now - replace with API call)
      const mockPlaylists: Playlist[] = [
        {
          id: '1',
          name: 'House Favorites',
          description: 'My favorite house tracks',
          userId: song.userId,
          songs: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Summer Vibes',
          description: 'Perfect for summer parties',
          userId: song.userId,
          songs: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setPlaylists(mockPlaylists);
    } catch (error) {
      console.error('Error loading song data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayFromBookmark = useCallback((timeInSeconds: number) => {
    if (song) {
      // First play the song
      playSong(song);
      
      // Then seek to the bookmark time
      setTimeout(() => {
        seekToTime(timeInSeconds);
      }, 1000); // Give time for the song to load
    }
  }, [song, playSong, seekToTime]);

  const handleAddBookmark = async () => {
    if (!song || !newBookmark.label.trim()) return;

    try {
      const bookmarkData = {
        songId: song.spotifyId, // Use spotifyId to ensure consistency
        userId: song.userId,
        timeInSeconds: newBookmark.timeInSeconds,
        label: newBookmark.label.trim(),
        description: newBookmark.description.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'bookmarks'), bookmarkData);
      
      const newBookmarkWithId: SongBookmark = {
        id: docRef.id,
        ...bookmarkData
      };

      setBookmarks(prev => [...prev, newBookmarkWithId].sort((a, b) => a.timeInSeconds - b.timeInSeconds));
      setNewBookmark({ timeInSeconds: 0, label: '', description: '' });
      setShowAddBookmark(false);
      
      // Refresh bookmarks in music player if this is the current song
      await refreshBookmarks();
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const handleUpdateBookmark = async (bookmark: SongBookmark) => {
    try {
      const bookmarkRef = doc(db, 'bookmarks', bookmark.id);
      const updateData = {
        ...bookmark,
        updatedAt: new Date()
      };
      
      await updateDoc(bookmarkRef, updateData);
      setBookmarks(prev => prev.map(b => b.id === bookmark.id ? updateData : b));
      setEditingBookmark(null);
      
      // Refresh bookmarks in music player if this is the current song
      await refreshBookmarks();
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await deleteDoc(doc(db, 'bookmarks', bookmarkId));
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      
      // Refresh bookmarks in music player if this is the current song
      await refreshBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!song) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-white">
                    Song Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Song Header */}
                    <div className="flex items-start space-x-4">
                      {song.imageUrl && (
                        <img
                          src={song.imageUrl}
                          alt={song.album}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">{song.name}</h2>
                        <p className="text-gray-300 mb-2">{song.artist}</p>
                        <p className="text-gray-400 text-sm mb-3">{song.album}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{formatDuration(song.duration)}</span>
                          <button
                            onClick={() => playSong(song)}
                            className="flex items-center space-x-1 text-green-400 hover:text-green-300"
                          >
                            <PlayIcon className="w-4 h-4" />
                            <span>Play Song</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <TagIcon className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Tags</h3>
                      </div>
                      {song.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {song.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                borderColor: tag.color,
                                color: tag.color,
                                border: '1px solid'
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No tags assigned to this song</p>
                      )}
                    </div>

                    {/* Playlists Section */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <QueueListIcon className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Playlists</h3>
                      </div>
                      {playlists.length > 0 ? (
                        <div className="space-y-2">
                          {playlists.map((playlist) => (
                            <div
                              key={playlist.id}
                              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                            >
                              <div>
                                <h4 className="text-white font-medium">{playlist.name}</h4>
                                {playlist.description && (
                                  <p className="text-gray-400 text-sm">{playlist.description}</p>
                                )}
                              </div>
                              <button className="text-blue-400 hover:text-blue-300 text-sm">
                                View Playlist
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">This song is not in any playlists</p>
                      )}
                    </div>

                    {/* Bookmarks Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <BookmarkIcon className="w-5 h-5 text-orange-400" />
                          <h3 className="text-lg font-semibold text-white">Bookmarks</h3>
                        </div>
                        <button
                          onClick={() => setShowAddBookmark(true)}
                          className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Add Bookmark</span>
                        </button>
                      </div>

                      {bookmarks.length > 0 ? (
                        <div className="space-y-2">
                          {bookmarks.map((bookmark) => (
                            <div
                              key={bookmark.id}
                              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group"
                            >
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handlePlayFromBookmark(bookmark.timeInSeconds)}
                                  className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full text-white"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-white font-medium">{bookmark.label}</span>
                                    <span className="text-gray-400 text-sm flex items-center">
                                      <ClockIcon className="w-3 h-3 mr-1" />
                                      {formatTime(bookmark.timeInSeconds)}
                                    </span>
                                  </div>
                                  {bookmark.description && (
                                    <p className="text-gray-400 text-sm">{bookmark.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingBookmark(bookmark)}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBookmark(bookmark.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No bookmarks for this song</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Bookmark Modal */}
                {showAddBookmark && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold text-white mb-4">Add Bookmark</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Time (seconds)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={Math.floor(song.duration / 1000)}
                            value={newBookmark.timeInSeconds}
                            onChange={(e) => setNewBookmark(prev => ({ 
                              ...prev, 
                              timeInSeconds: parseInt(e.target.value) || 0 
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(newBookmark.timeInSeconds)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={newBookmark.label}
                            onChange={(e) => setNewBookmark(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="e.g., Drop, Breakdown, Solo"
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Description (optional)
                          </label>
                          <input
                            type="text"
                            value={newBookmark.description}
                            onChange={(e) => setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Additional notes about this section"
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setShowAddBookmark(false)}
                          className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddBookmark}
                          disabled={!newBookmark.label.trim()}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg"
                        >
                          Add Bookmark
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
