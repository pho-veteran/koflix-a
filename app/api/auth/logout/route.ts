import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear all auth cookies
    const cookieStore = await cookies();
    cookieStore.delete('auth_session');
    cookieStore.delete('auth_user_id');
    cookieStore.delete('auth_timestamp');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ 
      error: 'Failed to log out',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}