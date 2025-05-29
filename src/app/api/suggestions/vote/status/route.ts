import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET to check if a user has voted on a suggestion
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const suggestionId = searchParams.get('suggestion_id');
    const userId = searchParams.get('user_id');
    const suggestionType = searchParams.get('suggestion_type'); // Optional parameter to avoid ID collisions
    
    if (!suggestionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }    // Make sure the suggestion ID is properly cast to integer for database query
    const numericSuggestionId = parseInt(suggestionId, 10);
    console.log(`Checking vote status for suggestion ID: ${suggestionId} (${numericSuggestionId}), user ID: ${userId}, type: ${suggestionType || 'any'}`);
    
    // Build the query based on whether suggestion type is specified
    let voteQuery: string;
    let queryParams: any[];
    
    if (suggestionType && (suggestionType === 'track' || suggestionType === 'arena')) {
      // Use specific suggestion type to avoid ID collisions
      voteQuery = `SELECT * FROM user_votes 
                   WHERE user_id = $1 AND suggestion_id = $2 AND suggestion_type = $3`;
      queryParams = [userId, numericSuggestionId, suggestionType];
    } else {
      // Fallback to checking both types (for backward compatibility)
      voteQuery = `SELECT * FROM user_votes 
                   WHERE user_id = $1 AND suggestion_id = $2 
                   AND suggestion_type IN ('track', 'arena')`;
      queryParams = [userId, numericSuggestionId];
    }
    
    const voteResult = await query(voteQuery, queryParams);
    
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