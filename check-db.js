const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

db.collection('songs').limit(1).get().then(snapshot => {
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    console.log('Sample song data:', JSON.stringify(doc.data(), null, 2));
  } else {
    console.log('No songs found in database');
  }
}).catch(err => console.error('Error:', err));
