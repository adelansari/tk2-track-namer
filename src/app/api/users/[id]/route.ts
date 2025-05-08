import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseConfig';

// GET user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id;
    
    // Get user profile from database
    const result = await query(
      'SELECT * FROM user_profiles WHERE uid = $1',
      [uid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT to update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id;
    const { display_name } = await request.json();
    
    if (!display_name || typeof display_name !== 'string') {
      return NextResponse.json(
        { message: 'Display name is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const checkUser = await query('SELECT * FROM user_profiles WHERE uid = $1', [uid]);
    
    if (checkUser.rows.length === 0) {
      // User doesn't exist, create new profile
      await query(
        'INSERT INTO user_profiles (uid, display_name, email) VALUES ($1, $2, $3)',
        [uid, display_name, 'user@example.com'] // Default email, should be updated from Firebase
      );
    } else {
      // Update existing user profile
      await query(
        'UPDATE user_profiles SET display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE uid = $2',
        [display_name, uid]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully',
      display_name 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}