import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin
initAdmin();

// Session duration - 7 days
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }
    
    // Get the Firebase Admin Auth instance
    const auth = getAuth();
    
    // Create a session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION, // 7 days
    });
    
    // Get the decoded token for user info
    const decodedIdToken = await auth.verifyIdToken(idToken);
    
    // Set the session cookie
    const cookieStore = await cookies();
    
    // Set auth session cookie (secure, HTTP-only)
    cookieStore.set({
      name: 'auth_session',
      value: sessionCookie,
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    
    // Set additional cookies (for client-side awareness)
    cookieStore.set({
      name: 'auth_user_id',
      value: decodedIdToken.uid,
      maxAge: SESSION_DURATION / 1000,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    
    cookieStore.set({
      name: 'auth_timestamp',
      value: Date.now().toString(),
      maxAge: SESSION_DURATION / 1000,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ 
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}