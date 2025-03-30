import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin
initAdmin();

export async function POST() {
  try {
    // Get the current session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ 
        error: 'No session cookie found' 
      }, { status: 401 });
    }
    
    // Get the Firebase Admin Auth instance
    const auth = getAuth();
    
    // Verify the current session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    
    if (!decodedClaims) {
      // Clear invalid cookies
      cookieStore.delete('auth_session');
      cookieStore.delete('auth_user_id');
      cookieStore.delete('auth_timestamp');
      
      return NextResponse.json({ 
        error: 'Invalid session' 
      }, { status: 401 });
    }
    
    // Create a new ID token for the user
    const customToken = await auth.createCustomToken(decodedClaims.uid);
    
    // Exchange custom token for an ID token (client-side step handled by the client)
    // This API only verifies the session is still valid
    
    return NextResponse.json({ 
      success: true,
      customToken,
      uid: decodedClaims.uid,
      // Include expiry time to help client-side code know when to refresh
      expiresAt: new Date(decodedClaims.exp * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    
    // Clear invalid cookies
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
    cookieStore.delete('auth_user_id');
    cookieStore.delete('auth_timestamp');
    
    return NextResponse.json({ 
      error: 'Failed to refresh session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 401 });
  }
}