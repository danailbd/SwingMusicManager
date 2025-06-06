'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Tag } from '@/types';
import { generateRandomColor } from '@/lib/utils';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TagManagerProps {
  userId: string;
}

export function TagManager({ userId }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  // Fetch user's tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', userId],
    queryFn: async () => {
      const q = query(collection(db, 'tags'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const tagData = {
        name: tagName,
        color: generateRandomColor(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addDoc(collection(db, 'tags'), tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      setNewTagName('');
    },
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ tagId, name }: { tagId: string; name: string }) => {
      await updateDoc(doc(db, 'tags', tagId), {
        name,
        updatedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      setEditingTag(null);
      setEditName('');
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      // First, delete all song-tag relationships
      const songTagsQuery = query(
        collection(db, 'songTags'),
        where('tagId', '==', tagId),
        where('userId', '==', userId)
      );
      const songTagsSnapshot = await getDocs(songTagsQuery);
      await Promise.all(songTagsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

      // Then delete the tag
      await deleteDoc(doc(db, 'tags', tagId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      queryClient.invalidateQueries({ queryKey: ['taggedSongs', userId] });
    },
  });

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate(newTagName.trim());
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
  };

  const handleSaveEdit = () => {
    if (editingTag && editName.trim()) {
      updateTagMutation.mutate({
        tagId: editingTag.id,
        name: editName.trim(),
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName('');
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag? This will remove it from all songs.')) {
      deleteTagMutation.mutate(tagId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Tag */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Create New Tag</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Enter tag name..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateTag();
              }
            }}
          />
          <button
            onClick={handleCreateTag}
            disabled={!newTagName.trim() || createTagMutation.isPending}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{createTagMutation.isPending ? 'Creating...' : 'Create'}</span>
          </button>
        </div>
      </div>

      {/* Tags List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Your Tags ({tags.length})</h3>
        
        {tags.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No tags created yet</p>
            <p className="text-sm">Create your first tag above to start organizing your music</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors duration-200"
              >
                {editingTag?.id === tag.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editName.trim() || updateTagMutation.isPending}
                        className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <CheckIcon className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-3 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-sm transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <XMarkIcon className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 mb-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      ></div>
                      <span className="text-white font-medium">{tag.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="flex-1 px-3 py-1 text-gray-400 hover:text-white hover:bg-blue-500/10 rounded text-sm transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <PencilIcon className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        disabled={deleteTagMutation.isPending}
                        className="flex-1 px-3 py-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded text-sm transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <TrashIcon className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
