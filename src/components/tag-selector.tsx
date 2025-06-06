'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, PlusIcon, TagIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SpotifyTrack, Tag } from '@/types';
import { generateRandomColor } from '@/lib/utils';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TagSelectorProps {
  track: SpotifyTrack;
  userId: string;
  onClose: () => void;
}

export function TagSelector({ track, userId, onClose }: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user's tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const q = query(collection(db, 'tags'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
    },
  });

  // Fetch existing tags for this track
  useEffect(() => {
    const fetchTrackTags = async () => {
      const q = query(
        collection(db, 'songTags'),
        where('songId', '==', track.id),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const trackTagIds = snapshot.docs.map(doc => doc.data().tagId);
      setSelectedTags(new Set(trackTagIds));
    };

    fetchTrackTags();
  }, [track.id, userId]);

  // Create new tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const tagData = {
        name: tagName,
        color: generateRandomColor(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'tags'), tagData);
      return { id: docRef.id, ...tagData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      setNewTagName('');
      setShowCreateTag(false);
    },
  });

  // Save song and tags mutation
  const saveTrackMutation = useMutation({
    mutationFn: async () => {
      // First, save the song if it doesn't exist
      const songData = {
        spotifyId: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        imageUrl: track.album.images[0]?.url || '',
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        uri: track.uri,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'songs', `${userId}_${track.id}`), songData, { merge: true });

      // Remove all existing tags for this song
      const existingTagsQuery = query(
        collection(db, 'songTags'),
        where('songId', '==', track.id),
        where('userId', '==', userId)
      );
      const existingSnapshot = await getDocs(existingTagsQuery);
      await Promise.all(existingSnapshot.docs.map(doc => deleteDoc(doc.ref)));

      // Add new tags
      await Promise.all(
        Array.from(selectedTags).map(tagId =>
          addDoc(collection(db, 'songTags'), {
            songId: track.id,
            tagId,
            userId,
            createdAt: new Date(),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taggedSongs', userId] });
      onClose();
    },
  });

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    setSelectedTags(newSelectedTags);
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate(newTagName.trim());
    }
  };

  const handleSave = () => {
    saveTrackMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Add Tags</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Track Info */}
          <div className="flex items-center space-x-3 mt-4">
            {track.album.images[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-12 h-12 rounded-lg"
              />
            )}
            <div>
              <p className="text-white font-medium">{track.name}</p>
              <p className="text-gray-400 text-sm">
                {track.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Existing Tags */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Select Tags</h3>
            {tags.length === 0 ? (
              <p className="text-gray-400 text-sm">No tags created yet. Create your first tag below.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                      selectedTags.has(tag.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: selectedTags.has(tag.id) ? tag.color : undefined,
                    }}
                  >
                    {selectedTags.has(tag.id) && <CheckIcon className="w-4 h-4 mr-1" />}
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create New Tag */}
          <div className="mb-6">
            {!showCreateTag ? (
              <button
                onClick={() => setShowCreateTag(true)}
                className="inline-flex items-center px-4 py-2 text-green-400 hover:text-white hover:bg-green-500/10 rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create New Tag
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || createTagMutation.isPending}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {createTagMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateTag(false);
                      setNewTagName('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saveTrackMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {saveTrackMutation.isPending ? 'Saving...' : 'Save Tags'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
