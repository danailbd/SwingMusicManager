import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // First test basic Firebase connection
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // Try to write a test document to check permissions
    const testDocRef = doc(db, 'test', 'connection-test');
    await setDoc(testDocRef, {
      timestamp: new Date().toISOString(),
      message: 'Firebase connection test',
      status: 'connected'
    });

    // Try to read it back
    const testRef = collection(db, 'test');
    const querySnapshot = await getDocs(testRef);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Firebase connection and permissions successful',
      documentsCount: documents.length,
      testData: documents,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Firebase test error:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message,
      code: error.code,
      stack: error.stack
    };
    
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      errorDetails,
      timestamp: new Date().toISOString(),
      suggestion: 'Check Firestore security rules and ensure they allow read/write operations'
    }, { status: 500 });
  }
}
