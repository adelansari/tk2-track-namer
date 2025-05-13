import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint is used to fix any vote count discrepancies between the user_votes table and the suggestion tables
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    
    if (!type || (type !== 'track' && type !== 'arena' && type !== 'all')) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing type parameter' },
        { status: 400 }
      );
    }
    
    await query('BEGIN');
    
    try {
      if (type === 'track' || type === 'all') {
        // Update track_suggestions vote counts based on user_votes table
        const trackResult = await query(`
          UPDATE track_suggestions ts
          SET votes = COALESCE((
            SELECT COUNT(*) 
            FROM user_votes uv 
            WHERE uv.suggestion_id = ts.id 
            AND uv.suggestion_type = 'track'
            AND uv.vote_type = 1
          ), 0)
        `);
        console.log('Fixed track votes:', trackResult);
      }
      
      if (type === 'arena' || type === 'all') {
        // Update arena_suggestions vote counts based on user_votes table
        const arenaResult = await query(`
          UPDATE arena_suggestions a
          SET votes = COALESCE((
            SELECT COUNT(*) 
            FROM user_votes uv 
            WHERE uv.suggestion_id = a.id 
            AND uv.suggestion_type = 'arena'
            AND uv.vote_type = 1
          ), 0)
        `);
        console.log('Fixed arena votes:', arenaResult);
      }
      
      await query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: `Successfully fixed ${type} vote counts`
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error fixing vote counts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fix vote counts' },
      { status: 500 }
    );
  }
}
