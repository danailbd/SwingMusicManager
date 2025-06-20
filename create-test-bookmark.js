const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// First, let's get a sample song to create a bookmark for
db.collection('songs').limit(1).get().then(snapshot => {
  if (!snapshot.empty) {
    const songDoc = snapshot.docs[0];
    const songData = songDoc.data();
    
    console.log('Found song:', songData.name, 'by', songData.artist);
    console.log('Song spotifyId:', songData.spotifyId);
    console.log('Song userId:', songData.userId);
    
    // Create a test bookmark for this song
    const testBookmark = {
      songId: songData.spotifyId, // Use Spotify ID to link bookmark to song
      userId: songData.userId,
      timeInSeconds: 30,
      label: 'Test Bookmark',
      description: 'A test bookmark at 30 seconds',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return db.collection('bookmarks').add(testBookmark);
  } else {
    console.log('No songs found - create a song first');
    throw new Error('No songs found');
  }
}).then((docRef) => {
  console.log('Test bookmark created with ID:', docRef.id);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
