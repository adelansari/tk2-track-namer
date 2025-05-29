import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get suggestion by ID with its type, optionally specifying the type to check
async function getSuggestionWithType(id: string, preferredType?: 'track' | 'arena') {
  // Ensure id is properly cast to integer for database query
  // This is crucial as arena IDs might be coming as numeric strings
  const numericId = parseInt(id, 10);
  
  // If a preferred type is specified, check that table first
  if (preferredType === 'track') {
    const trackResult = await query('SELECT *, \'track\' as type FROM track_suggestions WHERE id = $1', [numericId]);
    if (trackResult.rows.length > 0) {
      return { suggestion: trackResult.rows[0], type: 'track' };
    }
  } else if (preferredType === 'arena') {
    const arenaResult = await query('SELECT *, \'arena\' as type FROM arena_suggestions WHERE id = $1', [numericId]);
    if (arenaResult.rows.length > 0) {
      return { suggestion: arenaResult.rows[0], type: 'arena' };
    }
  } else {
    // No preferred type specified, check both tables (arena first for backward compatibility)
    const arenaResult = await query('SELECT *, \'arena\' as type FROM arena_suggestions WHERE id = $1', [numericId]);
    if (arenaResult.rows.length > 0) {
      return { suggestion: arenaResult.rows[0], type: 'arena' };
    }
    
    // Try track suggestions if not found in arena
    const trackResult = await query('SELECT *, \'track\' as type FROM track_suggestions WHERE id = $1', [numericId]);
    if (trackResult.rows.length > 0) {
      return { suggestion: trackResult.rows[0], type: 'track' };
    }
  }
  
  return { suggestion: null, type: null };
}

// POST to vote on a suggestion
export async function POST(request: NextRequest) {
  let id, user_id;
  try {    const requestData = await request.json();
    id = requestData.id;
    const action = requestData.action;
    user_id = requestData.user_id;
    const suggestionType = requestData.suggestion_type; // New parameter to specify type
    
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
    
    // Get the suggestion to vote on, using the preferred type if provided
    const { suggestion, type } = await getSuggestionWithType(id, suggestionType);
    
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

    // Begin transaction
    await query('BEGIN');
    
    try {
      let result;
      
      // If user already voted, remove the vote (toggle functionality)
      if (existingVoteResult.rows.length > 0) {
        // Delete the vote record
        await query(
          'DELETE FROM user_votes WHERE user_id = $1 AND suggestion_id = $2 AND suggestion_type = $3',
          [user_id, id, type]
        );
        
        // Decrement vote count
        if (type === 'track') {
          result = await query(
            'UPDATE track_suggestions SET votes = votes - 1 WHERE id = $1 RETURNING *',
            [id]
          );
        } else {
          result = await query(
            'UPDATE arena_suggestions SET votes = votes - 1 WHERE id = $1 RETURNING *',
            [id]
          );
        }
        
        // Commit transaction
        await query('COMMIT');
        
        return NextResponse.json({
          success: true,
          message: 'Vote removed successfully',
          suggestion: result.rows[0],
          action: 'removed'
        });
      } else {
        // Add new vote
        await query(
          'INSERT INTO user_votes (user_id, suggestion_id, suggestion_type, vote_type) VALUES ($1, $2, $3, $4)',
          [user_id, id, type, 1]
        );
        
        // Update suggestion votes - increment by 1
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
          suggestion: result.rows[0],
          action: 'added'
        });
      }
    } catch (error) {
      // Rollback in case of error
      await query('ROLLBACK');
      throw error;
    }  } catch (error) {
    console.error('Error voting on suggestion:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      id: id || 'undefined',
      user_id: user_id || 'undefined'
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to vote on suggestion',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}