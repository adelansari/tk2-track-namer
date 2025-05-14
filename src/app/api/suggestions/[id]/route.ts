import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserDisplayName } from '@/lib/firebaseAdmin';

// Helper function to get suggestion by ID with its type
async function getSuggestionWithType(id: string) {
  // Log the raw input ID
  console.log(`getSuggestionWithType received ID: ${id} (type: ${typeof id})`);
  
  // Ensure numeric ID is properly handled
  let numericId: number | null = null;
  try {
    numericId = parseInt(id, 10);
    // Check if the parsed number is actually a valid number
    if (isNaN(numericId)) {
      numericId = null;
      console.log(`ID couldn't be parsed as a number: ${id}`);
    } else {
      console.log(`Parsed numeric ID: ${numericId}`);
    }
  } catch (e) {
    console.error(`Failed to parse ID: ${id}`, e);
  }

  console.log(`Looking up suggestion with ID: ${id}, will use numericId: ${numericId}`);
    try {
    // Try both forms of ID (string and number) for track suggestions
    let trackResult;
    
    if (numericId !== null) {
      // Try with numeric ID first
      trackResult = await query('SELECT *, \'track\' as type FROM track_suggestions WHERE id = $1', [numericId]);
      console.log(`Track query with numeric ID ${numericId} returned ${trackResult.rows.length} rows`);
    }
    
    // If no results with numeric ID or numeric ID is null, try with string ID
    if (!trackResult?.rows.length) {
      trackResult = await query('SELECT *, \'track\' as type FROM track_suggestions WHERE id::text = $1', [id]);
      console.log(`Track query with string ID "${id}" returned ${trackResult.rows.length} rows`);
    }
    
    if (trackResult.rows.length > 0) {
      console.log('Found in track_suggestions:', trackResult.rows[0]);
      return { suggestion: trackResult.rows[0], type: 'track' };
    }
    
    // Try both forms of ID for arena suggestions
    let arenaResult;
    
    if (numericId !== null) {
      // Try with numeric ID first
      arenaResult = await query('SELECT *, \'arena\' as type FROM arena_suggestions WHERE id = $1', [numericId]);
      console.log(`Arena query with numeric ID ${numericId} returned ${arenaResult.rows.length} rows`);
    }
    
    // If no results with numeric ID or numeric ID is null, try with string ID
    if (!arenaResult?.rows.length) {
      arenaResult = await query('SELECT *, \'arena\' as type FROM arena_suggestions WHERE id::text = $1', [id]);
      console.log(`Arena query with string ID "${id}" returned ${arenaResult.rows.length} rows`);
    }    if (arenaResult.rows.length > 0) {
      console.log('Found in arena_suggestions:', arenaResult.rows[0]);
      return { suggestion: arenaResult.rows[0], type: 'arena' };
    }
    
    console.log(`No suggestion found with ID: ${id} (tried both string and numeric formats)`);
    return { suggestion: null, type: null };
  } catch (error) {
    console.error(`Error in getSuggestionWithType for ID ${id}:`, error);
    return { suggestion: null, type: null };
  }
}

// GET a specific suggestion by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { suggestion, type } = await getSuggestionWithType(id);
      if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Suggestion not found' },
        { status: 404 }
      );
    }
    
    // Add user display name from Firebase
    const displayName = await getUserDisplayName(suggestion.user_id);
    suggestion.user_display_name = displayName;
    
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const user_id = request.nextUrl.searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
      // Check for super user mode
    const isSuperUser = request.nextUrl.searchParams.get('super') === 'true';
    console.log(`Delete request - User ID: ${user_id}, Super mode: ${isSuperUser}`);
    
    // Get current suggestion details
    const { suggestion, type } = await getSuggestionWithType(id);
    
    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Suggestion not found' },
        { status: 404 }
      );
    }
    
    // Log the suggestion details for debugging
    console.log(`Suggestion details - ID: ${id}, Type: ${type}, Owner ID: ${suggestion.user_id}, Requester ID: ${user_id}`);
    
    // Allow deletion if super user mode is enabled or user owns the suggestion
    if (!isSuperUser && suggestion.user_id !== user_id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only delete your own suggestions' },
        { status: 403 }
      );
    }
    
    try {
      if (type === 'track') {
        await query('DELETE FROM track_suggestions WHERE id = $1', [id]);
      } else {
        await query('DELETE FROM arena_suggestions WHERE id = $1', [id]);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Suggestion deleted successfully'
      });    } catch (dbError: any) {
      console.error('Database error deleting suggestion:', dbError);
      return NextResponse.json(
        { success: false, message: `Database error: ${dbError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }  } catch (error) {
    console.error('Error deleting suggestion:', error);
    // Add more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete suggestion';
    
    // Safely get the ID parameter
    let id: string | undefined;
    try {
      id = params instanceof Promise ? (await params).id : params.id;
    } catch (paramError) {
      console.error('Error accessing params:', paramError);
    }
    
    const errorDetails = {
      success: false, 
      message: errorMessage,
      details: {
        id,
        user_id: request.nextUrl.searchParams.get('user_id'),
        super: request.nextUrl.searchParams.get('super'),
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      }
    };
    
    console.error('Detailed error info:', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}