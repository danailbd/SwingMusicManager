# Firebase Permissions Fix

## Issue
You're getting "Missing or insufficient permissions" because the current Firestore security rules expect Firebase Authentication, but your app uses Spotify OAuth.

## Quick Fix - Update Firestore Rules in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Navigate to Firestore Database** → **Rules**
4. **Replace the current rules with:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access for development
    // TODO: Implement proper authentication-based rules for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. **Click "Publish"**

## Alternative - Deploy via CLI (when available)

If you have Firebase CLI installed:
```bash
firebase login
firebase use --add  # Select your project
firebase deploy --only firestore:rules
```

## Long-term Solution

For production, you'll want to implement one of these approaches:

### Option 1: Custom Claims with Firebase Auth
- Authenticate users with Firebase Auth using custom tokens
- Include Spotify user ID in custom claims
- Use proper security rules

### Option 2: Server-side validation
- Keep all Firestore operations on the server-side
- Validate Spotify authentication in API routes
- Use Firebase Admin SDK for server operations

## Testing

After updating the rules, test with:
```bash
curl http://localhost:3000/api/test-firebase
```

You should see a success response instead of the permissions error.
