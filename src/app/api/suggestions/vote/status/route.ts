import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET to check if a user has voted on a suggestion
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const suggestionId = searchParams.get('suggestion_id');
    const userId = searchParams.get('user_id');
    
    if (!suggestionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check for vote in the user_votes table
    const voteResult = await query(
      'SELECT * FROM user_votes WHERE user_id = $1 AND suggestion_id = $2',
      [userId, suggestionId]
    );
    
    if (voteResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        vote: null,
        message: 'User has not voted on this suggestion'
      });
    }
    
    return NextResponse.json({
      success: true,
      vote: voteResult.rows[0],
      message: 'User vote found'
    });
  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}