"use client";

import { useEffect, useRef, useCallback } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Buffer time before expiry to refresh (15 minutes)
const REFRESH_BUFFER = 15 * 60 * 1000;
// 7 days in milliseconds
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function SessionRefresher() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Refreshing session...');
      
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

      const userCredential = await signInWithCustomToken(auth, data.customToken);
      const idToken = await userCredential.user.getIdToken();
      
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

  const setupSessionRefresh = useCallback(() => {
    clearRefreshTimer();
    
    try {
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
      
      const refreshTime = Math.max(
        1000, 
        SESSION_DURATION - REFRESH_BUFFER - sessionAge
      );
      
      const nextRefresh = new Date(now.getTime() + refreshTime);
      
      console.log(`Session refresh scheduled for ${nextRefresh.toLocaleTimeString()} (in ${Math.floor(refreshTime / 60000)} minutes)`);
      
      timerRef.current = setTimeout(async () => {
        const success = await refreshSession();
        if (success) {
          setupSessionRefresh();
        } else {
          timerRef.current = setTimeout(() => setupSessionRefresh(), 60 * 1000);
        }
      }, refreshTime);
    } catch (error) {
      console.error('Error setting up session refresh:', error);
    }
  }, [refreshSession, clearRefreshTimer]);

  const checkAuthentication = useCallback(() => {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const userIdCookie = cookies.find(c => c.startsWith('auth_user_id='));
    const timestampCookie = cookies.find(c => c.startsWith('auth_timestamp='));
    return !!userIdCookie && !!timestampCookie;
  }, []);

  useEffect(() => {
    const isAuthenticated = checkAuthentication();
    
    if (isAuthenticated) {
      setupSessionRefresh();
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout') {
        clearRefreshTimer();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearRefreshTimer();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthentication, setupSessionRefresh, clearRefreshTimer]);

  return null;
}