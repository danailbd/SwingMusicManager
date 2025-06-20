// Simple database check
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

console.log('Checking database collections...');

// Check songs
db.collection('songs').get().then(snapshot => {
  console.log(`Songs collection: ${snapshot.size} documents`);
  if (!snapshot.empty) {
    const sample = snapshot.docs[0].data();
    console.log('Sample song:', sample.name, 'by', sample.artist);
  }
}).catch(err => console.error('Songs error:', err));

// Check bookmarks
db.collection('bookmarks').get().then(snapshot => {
  console.log(`Bookmarks collection: ${snapshot.size} documents`);
  snapshot.docs.forEach((doc, i) => {
    const bookmark = doc.data();
    console.log(`  ${i+1}. "${bookmark.label}" at ${bookmark.timeInSeconds}s for song ${bookmark.songId}`);
  });
}).catch(err => console.error('Bookmarks error:', err));

setTimeout(() => process.exit(0), 2000);
