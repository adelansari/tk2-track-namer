import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET to check if a user has voted on multiple suggestions at once
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const suggestionIds = searchParams.getAll('suggestion_ids');
    const userId = searchParams.get('user_id');
    const suggestionType = searchParams.get('suggestion_type'); // Optional parameter to avoid ID collisions
    
    if (!suggestionIds.length || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`Checking vote status for ${suggestionIds.length} suggestions for user ID: ${userId}, type: ${suggestionType || 'any'}`);
    
    // Convert suggestion IDs to integers
    const numericSuggestionIds = suggestionIds.map(id => parseInt(id, 10));
    
    // Build the query based on whether suggestion type is specified
    let voteQuery: string;
    let queryParams: any[];
    
    if (suggestionType && (suggestionType === 'track' || suggestionType === 'arena')) {
      // Use specific suggestion type to avoid ID collisions
      voteQuery = `SELECT suggestion_id, vote_type FROM user_votes 
                   WHERE user_id = $1 AND suggestion_id = ANY($2::int[]) AND suggestion_type = $3`;
      queryParams = [userId, numericSuggestionIds, suggestionType];
    } else {
      // Fallback to checking both types (for backward compatibility)
      voteQuery = `SELECT suggestion_id, vote_type FROM user_votes 
                   WHERE user_id = $1 AND suggestion_id = ANY($2::int[]) 
                   AND suggestion_type IN ('track', 'arena')`;
      queryParams = [userId, numericSuggestionIds];
    }
    
    const voteResult = await query(voteQuery, queryParams);
    
    // Build a map of suggestion_id -> vote_type
    const voteMap: Record<string, number | null> = {};
    
    // Initialize all suggestions with null (no vote)
    suggestionIds.forEach(id => {
      voteMap[id] = null;
    });
    
    // Fill in the actual votes
    voteResult.rows.forEach(row => {
      voteMap[row.suggestion_id.toString()] = row.vote_type;
    });
    
    console.log(`Found ${voteResult.rows.length} votes out of ${suggestionIds.length} suggestions`);
    
    return NextResponse.json({
      success: true,
      votes: voteMap,
      message: `Checked ${suggestionIds.length} suggestions`
    });
  } catch (error) {
    console.error('Error checking batch vote status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}
