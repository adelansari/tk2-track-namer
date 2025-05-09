import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get suggestion by ID with its type
async function getSuggestionWithType(id: string) {
  // Try track suggestions first
  const trackResult = await query('SELECT *, \'track\' as type FROM track_suggestions WHERE id = $1', [id]);
  if (trackResult.rows.length > 0) {
    return { suggestion: trackResult.rows[0], type: 'track' };
  }
  
  // Try arena suggestions if not found
  const arenaResult = await query('SELECT *, \'arena\' as type FROM arena_suggestions WHERE id = $1', [id]);
  if (arenaResult.rows.length > 0) {
    return { suggestion: arenaResult.rows[0], type: 'arena' };
  }
  
  return { suggestion: null, type: null };
}

// POST to vote on a suggestion
export async function POST(request: NextRequest) {
  try {
    const { id, action, user_id } = await request.json();
    
    if (!id || !action || !user_id) {
      return NextResponse.json(
        { success: false, message: 'ID, action, and user_id are required' },
        { status: 400 }
      );
    }
    
    // Only allow upvote action
    if (action !== 'upvote') {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Only "upvote" is supported' },
        { status: 400 }
      );
    }
    
    // Get the suggestion to vote on
    const { suggestion, type } = await getSuggestionWithType(id);
    
    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted on this suggestion
    const existingVoteResult = await query(
      'SELECT * FROM user_votes WHERE user_id = $1 AND suggestion_id = $2 AND suggestion_type = $3',
      [user_id, id, type]
    );

    if (existingVoteResult.rows.length > 0) {
      // User already voted, don't allow duplicate votes
      return NextResponse.json({
        success: false,
        message: 'You have already voted on this suggestion'
      }, { status: 400 });
    }
    
    // If no existing vote, create new vote record and update suggestion
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Create vote record - always vote_type = 1 for upvote
      await query(
        'INSERT INTO user_votes (user_id, suggestion_id, suggestion_type, vote_type) VALUES ($1, $2, $3, $4)',
        [user_id, id, type, 1]
      );
      
      // Update suggestion votes - always increment by 1
      let result;
      if (type === 'track') {
        result = await query(
          'UPDATE track_suggestions SET votes = votes + 1 WHERE id = $1 RETURNING *',
          [id]
        );
      } else {
        result = await query(
          'UPDATE arena_suggestions SET votes = votes + 1 WHERE id = $1 RETURNING *',
          [id]
        );
      }
      
      // Commit transaction
      await query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Upvoted successfully',
        suggestion: result.rows[0]
      });
    } catch (error) {
      // Rollback in case of error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error voting on suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to vote on suggestion' },
      { status: 500 }
    );
  }
}