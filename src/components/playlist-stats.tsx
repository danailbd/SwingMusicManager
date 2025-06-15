'use client';

import { useMemo } from 'react';
import { 
  MusicalNoteIcon, 
  CloudArrowUpIcon, 
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Playlist } from '../types';

interface PlaylistStatsProps {
  playlists: Playlist[];
}

export function PlaylistStats({ playlists }: PlaylistStatsProps) {
  const stats = useMemo(() => {
    const total = playlists.length;
    const spotifyPlaylists = playlists.filter(p => p.isSpotifyPlaylist).length;
    const totalSongs = playlists.reduce((sum, p) => sum + (p.songs?.length || 0), 0);
    const totalTags = new Set(
      playlists.flatMap(p => 
        p.songs?.flatMap(s => s.tags?.map(t => t.id) || []) || []
      )
    ).size;
    
    const recentlyCreated = playlists.filter(p => {
      const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length;

    const recentlySynced = playlists.filter(p => {
      if (!p.lastSyncedAt) return false;
      const syncedAt = p.lastSyncedAt?.toDate?.() || new Date(p.lastSyncedAt);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return syncedAt > dayAgo;
    }).length;

    return {
      total,
      spotifyPlaylists,
      localPlaylists: total - spotifyPlaylists,
      totalSongs,
      totalTags,
      recentlyCreated,
      recentlySynced,
    };
  }, [playlists]);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <MusicalNoteIcon className="w-6 h-6 mr-2 text-blue-400" />
        Playlist Overview
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Playlists */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Playlists</div>
        </div>

        {/* Spotify Playlists */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="text-2xl font-bold text-green-400 mr-2">{stats.spotifyPlaylists}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <div className="text-sm text-gray-400">Spotify Synced</div>
        </div>

        {/* Total Songs */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">{stats.totalSongs}</div>
          <div className="text-sm text-gray-400">Total Songs</div>
        </div>

        {/* Total Tags */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="text-2xl font-bold text-orange-400 mr-2">{stats.totalTags}</span>
            <TagIcon className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-sm text-gray-400">Unique Tags</div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-white font-medium">{stats.recentlyCreated}</span>
              <span className="text-gray-400 ml-2">created this week</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <CloudArrowUpIcon className="w-5 h-5 text-green-400" />
            <div>
              <span className="text-white font-medium">{stats.recentlySynced}</span>
              <span className="text-gray-400 ml-2">synced today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {stats.total > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap gap-3">
            {stats.localPlaylists > 0 && (
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm">
                {stats.localPlaylists} local playlist{stats.localPlaylists !== 1 ? 's' : ''} ready to sync
              </div>
            )}
            {stats.spotifyPlaylists > 0 && (
              <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                {stats.spotifyPlaylists} Spotify playlist{stats.spotifyPlaylists !== 1 ? 's' : ''} connected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
