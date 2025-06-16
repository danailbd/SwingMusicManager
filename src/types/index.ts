export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongTag {
  id: string;
  songId: string;
  tagId: string;
  userId: string;
  createdAt: Date;
}

export interface TaggedSong {
  id: string;
  spotifyId: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  duration: number;
  previewUrl: string | null;
  spotifyUrl: string;
  uri: string;
  userId: string;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SongBookmark {
  id: string;
  songId: string;
  userId: string;
  timeInSeconds: number;
  label: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  songs: TaggedSong[];
  createdAt: Date;
  updatedAt: Date;
  spotifyId?: string;
  isSpotifyPlaylist?: boolean;
  lastSyncedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  spotifyId?: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
