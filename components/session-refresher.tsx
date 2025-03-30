"use client";

import { useEffect, useRef, useCallback } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Buffer time before expiry to refresh (15 minutes)
const REFRESH_BUFFER = 15 * 60 * 1000;
// 7 days in milliseconds (should match server-side value)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function SessionRefresher() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear refresh timer when component unmounts
  const clearRefreshTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Function to refresh the session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Refreshing session...');
      
      // Call the refresh session API
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }

      const data = await response.json();
      
      if (!data.success || !data.customToken) {
        throw new Error('Invalid response from refresh session API');
      }

      // Sign in with the custom token
      const userCredential = await signInWithCustomToken(auth, data.customToken);
      
      // Get the new ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Create a new session with the fresh ID token
      const sessionResponse = await fetch('/api/auth/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create new session');
      }

      console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }, []);

  // Function to setup session renewal
  const setupSessionRefresh = useCallback(() => {
    // Clean up any existing timer first
    clearRefreshTimer();
    
    try {
      // Get the auth timestamp cookie
      const timestampCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_timestamp='));

      if (!timestampCookie) {
        console.warn('No auth timestamp cookie found');
        return;
      }
      
      const timestamp = parseInt(timestampCookie.split('=')[1], 10);
      const sessionStartTime = new Date(timestamp);
      const now = new Date();
      const sessionAge = now.getTime() - sessionStartTime.getTime();
      
      // Calculate time until refresh needed
      const refreshTime = Math.max(
        1000, // Minimum 1 second
        SESSION_DURATION - REFRESH_BUFFER - sessionAge
      );
      
      // Schedule refresh before session expires
      const nextRefresh = new Date(now.getTime() + refreshTime);
      
      console.log(`Session refresh scheduled for ${nextRefresh.toLocaleTimeString()} (in ${Math.floor(refreshTime / 60000)} minutes)`);
      
      timerRef.current = setTimeout(async () => {
        const success = await refreshSession();
        if (success) {
          // If refresh was successful, schedule the next one
          setupSessionRefresh();
        } else {
          // If refresh failed, try again in 1 minute
          timerRef.current = setTimeout(() => setupSessionRefresh(), 60 * 1000);
        }
      }, refreshTime);
    } catch (error) {
      console.error('Error setting up session refresh:', error);
    }
  }, [refreshSession, clearRefreshTimer]);

  // Check if the user is authenticated by checking the cookie
  const checkAuthentication = useCallback(() => {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth_session='));
    return !!authCookie;
  }, []);

  // Set up effect for session refresh scheduling
  useEffect(() => {
    // Check if authenticated
    const isAuthenticated = checkAuthentication();
    
    // Only manage sessions for authenticated users
    if (isAuthenticated) {
      setupSessionRefresh();
    }
    
    // Listen for storage events (for multi-tab logout support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout') {
        clearRefreshTimer();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup when unmounting
    return () => {
      clearRefreshTimer();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthentication, setupSessionRefresh, clearRefreshTimer]);

  // This component doesn't render anything visible
  return null;
}