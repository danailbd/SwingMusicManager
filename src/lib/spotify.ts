export const SPOTIFY_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
  scopes: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-recently-played', // Added for recent songs feature
  ],
};

export const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CONFIG.clientId}&scope=${SPOTIFY_CONFIG.scopes.join('%20')}&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.redirectUri)}`;

export class SpotifyAPI {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async searchTracks(query: string, limit = 20) {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }

    return response.json();
  }

  async getTrack(trackId: string) {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get track');
    }

    return response.json();
  }

  async getUserPlaylists() {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user playlists');
    }

    return response.json();
  }

  async createPlaylist(name: string, description?: string, isPublic = false) {
    if (!this.accessToken) throw new Error('No access token available');

    // First get user ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const user = await userResponse.json();

    const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create playlist');
    }

    return response.json();
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]) {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add tracks to playlist');
    }

    return response.json();
  }

  async updatePlaylist(playlistId: string, playlistData: { name?: string; description?: string; public?: boolean }) {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playlistData),
    });

    if (!response.ok) {
      throw new Error('Failed to update playlist');
    }

    return response.json();
  }

  async replacePlaylistTracks(playlistId: string, trackUris: string[]) {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to replace playlist tracks');
    }

    return response.json();
  }

  async getRecentlyPlayedTracks(limit = 50) {
    if (!this.accessToken) throw new Error('No access token available');

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Spotify recently played API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to get recently played tracks: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return response.json();
  }
}
