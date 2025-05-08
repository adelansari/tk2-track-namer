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
    const { id, action } = await request.json();
    
    if (!id || !action) {
      return NextResponse.json(
        { success: false, message: 'ID and action are required' },
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
    
    // Calculate the vote change
    const voteChange = action === 'upvote' ? 1 : -1;
    
    // Update the votes
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
    
    return NextResponse.json({
      success: true,
      message: `${action === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`,
      suggestion: result.rows[0]
    });
  } catch (error) {
    console.error('Error voting on suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to vote on suggestion' },
      { status: 500 }
    );
  }
}