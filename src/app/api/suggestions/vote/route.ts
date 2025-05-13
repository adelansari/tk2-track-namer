import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get suggestion by ID with its type
async function getSuggestionWithType(id: string) {
  // Ensure id is properly cast to integer for database query
  // This is crucial as arena IDs might be coming as numeric strings
  const numericId = parseInt(id, 10);
  console.log(`Looking up suggestion with ID: ${id} (${numericId})`);
  
  // Check both tables but check arena suggestions first
  const arenaResult = await query('SELECT *, \'arena\' as type FROM arena_suggestions WHERE id = $1', [numericId]);
  if (arenaResult.rows.length > 0) {
    console.log('Found in arena_suggestions');
    return { suggestion: arenaResult.rows[0], type: 'arena' };
  }
  
  // Try track suggestions if not found in arena
  const trackResult = await query('SELECT *, \'track\' as type FROM track_suggestions WHERE id = $1', [numericId]);
  if (trackResult.rows.length > 0) {
    console.log('Found in track_suggestions');
    return { suggestion: trackResult.rows[0], type: 'track' };
  }
  
  console.log(`No suggestion found with ID: ${id}`);
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
    }
  } catch (error) {
    console.error('Error voting on suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to vote on suggestion' },
      { status: 500 }
    );
  }
}