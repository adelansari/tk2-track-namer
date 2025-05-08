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

// GET a specific suggestion by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { suggestion, type } = await getSuggestionWithType(id);
    
    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Suggestion not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      suggestion,
      type
    });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch suggestion' },
      { status: 500 }
    );
  }
}

// PUT to update a suggestion
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { name, user_id } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    // Get current suggestion to verify ownership
    const { suggestion, type } = await getSuggestionWithType(id);
    
    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Suggestion not found' },
        { status: 404 }
      );
    }
    
    // Verify that the user owns this suggestion
    if (suggestion.user_id !== user_id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only update your own suggestions' },
        { status: 403 }
      );
    }
    
    let result;
    if (type === 'track') {
      result = await query(
        'UPDATE track_suggestions SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [name, id]
      );
    } else {
      result = await query(
        'UPDATE arena_suggestions SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [name, id]
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Suggestion updated successfully',
      suggestion: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}

// DELETE a suggestion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const user_id = request.nextUrl.searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get current suggestion to verify ownership
    const { suggestion, type } = await getSuggestionWithType(id);
    
    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Suggestion not found' },
        { status: 404 }
      );
    }
    
    // Verify that the user owns this suggestion
    if (suggestion.user_id !== user_id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only delete your own suggestions' },
        { status: 403 }
      );
    }
    
    if (type === 'track') {
      await query('DELETE FROM track_suggestions WHERE id = $1', [id]);
    } else {
      await query('DELETE FROM arena_suggestions WHERE id = $1', [id]);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Suggestion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete suggestion' },
      { status: 500 }
    );
  }
}