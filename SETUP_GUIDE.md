# Song Tagger - Setup Guide

## Required API Keys Configuration

### 1. Spotify Developer Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app (or use existing)
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy your Client ID and Client Secret

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the config

### 3. Update .env.local file
Replace the placeholder values in `.env.local` with your actual keys:

```bash
# Spotify API Configuration
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify

# Firebase Configuration  
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_string
```

### 4. Test the Integration
1. Restart your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Connect with Spotify"
4. Complete OAuth flow
5. You should be redirected to the dashboard

## Testing Without Real Keys
If you want to test the UI without setting up APIs:
- The app will show connection errors but the UI will work
- You can navigate to `/dashboard` directly to see the interface
- Mock data can be added for development
