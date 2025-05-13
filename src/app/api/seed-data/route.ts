import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// This endpoint adds some seed data to make sure the database has content
export async function GET() {
  try {
    // Set search path - critical for proper schema access
    await query('SET search_path TO tk2namechanger_besidehorn');
    
    // Check if we have any track suggestions already
    const existingTracksResult = await query('SELECT COUNT(*) as count FROM track_suggestions');
    const existingTracksCount = parseInt(existingTracksResult.rows[0].count);
    
    // Only seed if we have no suggestions
    if (existingTracksCount === 0) {
      // Add a sample track suggestion
      await query(
        'INSERT INTO track_suggestions (track_id, user_id, name, votes) VALUES ($1, $2, $3, $4)',
        ['track-01', 'seed-user', 'Forest Circuit', 3]
      );
      
      await query(
        'INSERT INTO track_suggestions (track_id, user_id, name, votes) VALUES ($1, $2, $3, $4)',
        ['track-01', 'seed-user-2', 'Woodland Way', 2]
      );
      
      await query(
        'INSERT INTO track_suggestions (track_id, user_id, name, votes) VALUES ($1, $2, $3, $4)',
        ['track-02', 'seed-user', 'Mushroom Madness', 4]
      );
    }
    
    // Check if we have any arena suggestions already
    const existingArenasResult = await query('SELECT COUNT(*) as count FROM arena_suggestions');
    const existingArenasCount = parseInt(existingArenasResult.rows[0].count);
    
    // Only seed if we have no suggestions
    if (existingArenasCount === 0) {
      // Add a sample arena suggestion
      await query(
        'INSERT INTO arena_suggestions (arena_id, user_id, name, votes) VALUES ($1, $2, $3, $4)',
        ['arena-01', 'seed-user', 'Lava Dome', 5]
      );
      
      await query(
        'INSERT INTO arena_suggestions (arena_id, user_id, name, votes) VALUES ($1, $2, $3, $4)',
        ['arena-02', 'seed-user-2', 'Frost Arena', 2]
      );
    }
    
    // Get updated counts
    const trackCountsResult = await query('SELECT COUNT(*) as count FROM track_suggestions');
    const arenaCountsResult = await query('SELECT COUNT(*) as count FROM arena_suggestions');
    
    return NextResponse.json({
      success: true,
      message: 'Seed data check completed',
      initialCounts: {
        tracks: existingTracksCount,
        arenas: existingArenasCount
      },
      currentCounts: {
        tracks: parseInt(trackCountsResult.rows[0].count),
        arenas: parseInt(arenaCountsResult.rows[0].count)
      }
    });
    
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to seed data',
      error: error.message || String(error)
    }, { status: 500 });
  }
}
