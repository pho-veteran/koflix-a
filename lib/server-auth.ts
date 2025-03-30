import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from './firebase-admin';
import { redirect } from 'next/navigation';

// Initialize Firebase Admin
initAdmin();

/**
 * Verify the session cookie on the server side
 */
export async function verifySessionCookie() {
  try {
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    
    if (!sessionCookie) {
      return { authenticated: false, userId: null };
    }
    
    // Get the Firebase Admin Auth instance
    const auth = getAuth();
    
    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    return {
      authenticated: true,
      userId: decodedClaims.uid,
      decodedClaims,
    };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    
    // Clear invalid cookies
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
    cookieStore.delete('auth_user_id');
    cookieStore.delete('auth_timestamp');
    
    return {
      authenticated: false,
      userId: null,
    };
  }
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  try {
    const { authenticated, userId } = await verifySessionCookie();
    
    if (!authenticated || !userId) {
      return null;
    }
    
    // Get the user data from Firebase Admin
    const auth = getAuth();
    const user = await auth.getUser(userId);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Server component function to require authentication 
 * and redirect if not authenticated
 */
export async function requireAuth() {
  const { authenticated } = await verifySessionCookie();
  
  if (!authenticated) {
    redirect('/login');
  }
}