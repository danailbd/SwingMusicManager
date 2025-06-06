import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase connection by trying to read from a collection
    const testRef = collection(db, 'test');
    await getDocs(testRef);
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Firebase connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
