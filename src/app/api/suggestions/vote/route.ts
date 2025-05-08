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
    
    if (action !== 'upvote' && action !== 'downvote') {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "upvote" or "downvote"' },
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
      const existingVote = existingVoteResult.rows[0];
      const existingVoteType = existingVote.vote_type;
      
      // If trying to vote the same way again, return error
      if ((action === 'upvote' && existingVoteType === 1) || 
          (action === 'downvote' && existingVoteType === -1)) {
        return NextResponse.json({
          success: false,
          message: `You have already ${action === 'upvote' ? 'upvoted' : 'downvoted'} this suggestion`
        }, { status: 400 });
      }
      
      // If changing vote (e.g., from upvote to downvote), update both tables
      const voteChange = action === 'upvote' ? 2 : -2; // Double effect: remove old vote and add new one
      
      // Begin transaction
      await query('BEGIN');
      
      try {
        // Update vote record
        await query(
          'UPDATE user_votes SET vote_type = $1, created_at = NOW() WHERE id = $2',
          [action === 'upvote' ? 1 : -1, existingVote.id]
        );
        
        // Update suggestion vote count
        let result;
        if (type === 'track') {
          result = await query(
            'UPDATE track_suggestions SET votes = votes + $1 WHERE id = $2 RETURNING *',
            [voteChange, id]
          );
        } else {
          result = await query(
            'UPDATE arena_suggestions SET votes = votes + $1 WHERE id = $2 RETURNING *',
            [voteChange, id]
          );
        }
        
        // Commit transaction
        await query('COMMIT');
        
        return NextResponse.json({
          success: true,
          message: `Vote changed to ${action === 'upvote' ? 'upvote' : 'downvote'} successfully`,
          suggestion: result.rows[0]
        });
      } catch (error) {
        // Rollback in case of error
        await query('ROLLBACK');
        throw error;
      }
    }
    
    // If no existing vote, create new vote record and update suggestion
    const voteValue = action === 'upvote' ? 1 : -1;
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Create vote record
      await query(
        'INSERT INTO user_votes (user_id, suggestion_id, suggestion_type, vote_type) VALUES ($1, $2, $3, $4)',
        [user_id, id, type, voteValue]
      );
      
      // Update suggestion votes
      let result;
      if (type === 'track') {
        result = await query(
          'UPDATE track_suggestions SET votes = votes + $1 WHERE id = $2 RETURNING *',
          [voteValue, id]
        );
      } else {
        result = await query(
          'UPDATE arena_suggestions SET votes = votes + $1 WHERE id = $2 RETURNING *',
          [voteValue, id]
        );
      }
      
      // Commit transaction
      await query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: `${action === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`,
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