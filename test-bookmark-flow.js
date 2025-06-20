// Test the bookmark creation and loading functionality
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testBookmarkFlow() {
  try {
    console.log('Testing bookmark creation and loading...');
    
    // First, get a sample song
    const songsSnapshot = await db.collection('songs').limit(1).get();
    if (songsSnapshot.empty) {
      console.log('No songs found in database. Please add a song first by searching and playing a track.');
      return;
    }
    
    const songDoc = songsSnapshot.docs[0];
    const songData = songDoc.data();
    
    console.log(`Found song: "${songData.name}" by ${songData.artist}`);
    console.log(`Song ID: ${songData.spotifyId}`);
    console.log(`User ID: ${songData.userId}`);
    
    // Check existing bookmarks for this song
    const bookmarksSnapshot = await db.collection('bookmarks')
      .where('songId', '==', songData.spotifyId)
      .where('userId', '==', songData.userId)
      .get();
    
    console.log(`\nExisting bookmarks for this song: ${bookmarksSnapshot.size}`);
    bookmarksSnapshot.docs.forEach((doc, index) => {
      const bookmark = doc.data();
      console.log(`  ${index + 1}. "${bookmark.label}" at ${bookmark.timeInSeconds}s - ${bookmark.description || 'No description'}`);
    });
    
    console.log('\nBookmark system ready for testing!');
    console.log('\nTo test:');
    console.log('1. Search for a song and play it');
    console.log('2. Click the "+" button in the music player controls');
    console.log('3. Add a bookmark with a custom label');
    console.log('4. Check that the bookmark appears in the player');
    
  } catch (error) {
    console.error('Error testing bookmark flow:', error);
  }
}

testBookmarkFlow().then(() => {
  process.exit(0);
});
