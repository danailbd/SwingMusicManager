const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Check songs
db.collection('songs').limit(1).get().then(snapshot => {
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    console.log('Sample song data:', JSON.stringify(doc.data(), null, 2));
  } else {
    console.log('No songs found in database');
  }
}).catch(err => console.error('Error checking songs:', err));

// Check bookmarks
db.collection('bookmarks').limit(10).get().then(snapshot => {
  console.log(`Found ${snapshot.size} bookmarks in database`);
  snapshot.docs.forEach(doc => {
    console.log('Bookmark:', JSON.stringify(doc.data(), null, 2));
  });
  if (snapshot.empty) {
    console.log('No bookmarks found in database');
  }
}).catch(err => console.error('Error checking bookmarks:', err));
