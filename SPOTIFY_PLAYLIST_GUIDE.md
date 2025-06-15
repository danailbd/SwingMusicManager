# Spotify Playlist Management - User Guide

## Overview

The Song Tagger app now supports full Spotify playlist management, allowing you to:
- Import Spotify playlists into the app for tagging
- Export app playlists to Spotify
- Sync changes between the app and Spotify
- Manage both local and Spotify playlists from one interface

## Features

### 1. Import Spotify Playlists

**Location**: Playlist Library → "Import from Spotify" section

**How it works**:
1. The app automatically loads your Spotify playlists
2. Click on any Spotify playlist to select it
3. Click "Import & Tag" to import the playlist and all its songs
4. Songs are automatically added to your local song library
5. The playlist maintains its connection to Spotify

**What gets imported**:
- Playlist name and description
- All tracks with metadata (name, artist, album, duration)
- Album artwork and Spotify URLs
- Spotify URIs for playback

### 2. Create Playlists on Spotify

**Location**: Any local playlist → "Create on Spotify" button

**How it works**:
1. Select any playlist you've created in the app
2. Click "Create on Spotify" in the playlist details or library
3. The playlist is created on your Spotify account
4. All songs with Spotify URIs are added to the Spotify playlist
5. The local playlist is now linked to the Spotify version

### 3. Sync Playlists with Spotify

**Location**: Any Spotify-linked playlist → "Sync to Spotify" button

**How it works**:
1. Make changes to a playlist in the app (add/remove songs, edit tags)
2. Click "Sync to Spotify" 
3. The app compares local vs Spotify versions
4. Adds missing songs to Spotify
5. Removes songs that were deleted locally
6. Updates playlist name and description

**Sync indicators**:
- Green dot (🟢) = Playlist is synced with Spotify
- "Spotify" badge = Shows Spotify connection status
- Last sync time displayed in playlist details

## User Interface Guide

### Playlist Library

#### Create New Playlist Section
- **New Playlist**: Create empty playlists locally
- Form fields: Name (required), Description (optional)

#### Import from Spotify Section
- Lists all your Spotify playlists
- Shows track count and owner
- "Import & Tag" button for each playlist
- "Already Imported" status for previously imported playlists

#### Your Tagged Playlists Section
- Shows all your local playlists
- Green dot indicates Spotify-synced playlists
- **View Details**: Opens detailed playlist view
- **Sync to Spotify**: Updates Spotify version
- **Create on Spotify**: Creates new Spotify playlist

### Playlist Detail View

#### Header Controls
- **Back button**: Return to playlist library
- **Spotify indicator**: Shows if playlist is synced
- **Sync to Spotify**: Sync changes to Spotify
- **Create on Spotify**: Create new Spotify playlist
- **Open in Spotify**: Direct link to Spotify (if synced)

#### Playlist Information
- Song count and sync status
- Creation date and last sync time
- Spotify connection indicator

#### Song Management
- **Search**: Find songs by name, artist, album, or tags
- **Tag Filter**: Filter by specific tags
- **Play controls**: Individual songs and full playlist
- **Active filters**: Clear search/filters quickly

## API Endpoints

### Import Spotify Playlist
```
POST /api/playlists/import-spotify
Body: { spotifyPlaylistId: string }
```

### Sync to Spotify
```
POST /api/playlists/[id]/sync-to-spotify
Body: { action: 'sync' | 'create' }
```

### Get User Playlists
```
GET /api/user-playlists
```

## Data Flow

### Import Process
1. User selects Spotify playlist
2. App fetches playlist details from Spotify API
3. App fetches all tracks from Spotify API
4. Songs are created/updated in Firestore
5. Playlist is created in Firestore with Spotify connection
6. UI updates to show imported playlist

### Sync Process
1. User modifies playlist locally (add/remove songs, edit metadata)
2. User clicks "Sync to Spotify"
3. App fetches current Spotify playlist tracks
4. App compares local vs Spotify track lists
5. App adds missing tracks to Spotify
6. App removes extra tracks from Spotify
7. App updates playlist metadata on Spotify
8. Local playlist is marked with sync timestamp

## Database Schema

### Playlist Document (Firestore)
```typescript
{
  id: string;
  name: string;
  description?: string;
  userId: string;
  songs: TaggedSong[];
  spotifyId?: string;        // Spotify playlist ID
  isSpotifyPlaylist?: boolean; // True if imported/synced
  lastSyncedAt?: Date;       // Last sync timestamp
  createdAt: Date;
  updatedAt: Date;
}
```

### Song Document (Firestore)
```typescript
{
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  spotifyId: string;         // Spotify track ID
  uri: string;              // Spotify URI for playback
  previewUrl?: string;       // 30-second preview
  imageUrl: string;         // Album artwork
  spotifyUrl: string;       // Spotify web link
  userId: string;
  tags: Tag[];              // User-defined tags
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Common Errors and Solutions

**"Not authenticated"**
- Solution: Make sure you're logged in to Spotify
- Check: Authentication status in the app

**"Playlist already imported"**
- Solution: The playlist is already in your library
- Check: Look for it in "Your Tagged Playlists"

**"Failed to sync playlist to Spotify"**
- Possible causes: Network issues, Spotify API limits, invalid tokens
- Solution: Try again in a few minutes, or re-authenticate

**"Failed to add tracks to playlist"**
- Possible causes: Some tracks may not be available in your region
- Solution: Sync will skip unavailable tracks and continue

### Rate Limiting
- Spotify API has rate limits
- Large playlists may take longer to import/sync
- The app includes retry logic for failed requests

## Testing

Use the test page at `/test-spotify-integration` to verify:
1. Authentication status
2. Spotify playlist loading
3. Import functionality
4. Sync functionality
5. Error handling

## Best Practices

### For Users
1. **Regular Syncing**: Sync playlists after making changes
2. **Batch Operations**: Make multiple changes before syncing
3. **Network**: Ensure stable internet for large playlists
4. **Backup**: Your local playlists are preserved even if Spotify sync fails

### For Developers
1. **Error Handling**: All API calls include try-catch blocks
2. **User Feedback**: Clear notifications for all operations
3. **Idempotency**: Import operations are safe to retry
4. **Data Consistency**: Local data is source of truth for syncing

## Troubleshooting

### Playlist Not Appearing After Import
1. Check browser console for errors
2. Refresh the playlist library
3. Verify authentication status
4. Check if playlist was actually created in Firestore

### Sync Not Working
1. Check if playlist has `spotifyId` set
2. Verify Spotify authentication is valid
3. Check for API rate limiting errors
4. Ensure songs have valid Spotify URIs

### Missing Songs After Sync
1. Some tracks may not be available in your region
2. Check Spotify for regional restrictions
3. Songs without Spotify URIs are skipped
4. Check console logs for specific track errors

## Future Enhancements

Planned features:
- Collaborative playlist support
- Automatic sync scheduling
- Conflict resolution for simultaneous edits
- Playlist sharing between app users
- Advanced filtering and search options
- Bulk tag operations
- Playlist analytics and insights
