/**
 * This file is preserved for backward compatibility but no longer in active use.
 * 
 * The application now uses Firebase Auth as the single source of truth for user display names.
 * All user profile updates are done through Firebase Auth directly.
 * 
 * Firebase Admin SDK is used in API routes to fetch user display names when needed.
 */

import { getUserDisplayName } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET user profile (using Firebase Auth instead of database)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id;
    
    // Get display name from Firebase Auth
    const displayName = await getUserDisplayName(uid);
    
    return NextResponse.json({
      uid,
      display_name: displayName,
      success: true
    });
  } catch (error) {
    console.error('Error fetching user profile from Firebase:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user profile', success: false },
      { status: 500 }
    );
  }
}

// PUT to update user profile - this now just returns success without doing anything
// since profile updates happen directly through Firebase Auth
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // We just return success as Firebase Auth is now the source of truth
    // The actual update happens in the client via updateProfile API
    return NextResponse.json({ 
      success: true,
      message: 'Firebase Auth is now used for profile management'
    });
  } catch (error) {
    console.error('Error in user profile endpoint:', error);
    return NextResponse.json(
      { message: 'Server error', success: false },
      { status: 500 }
    );
  }
}