import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    database: { connected: false },
    firebase: { initialized: false },
    counts: { tracks: 0, arenas: 0 },
    tables: []
  };
  
  try {
    // Test database connection
    const dbResult = await query('SELECT NOW() as time');
    results.database = {
      connected: true,
      time: dbResult.rows[0].time
    };
    
    // Check Firebase
    try {
      // List just one user to test Firebase connection
      const firebaseResult = await adminAuth.listUsers(1);
      results.firebase = {
        initialized: true,
        users: firebaseResult.users.length > 0
      };
    } catch (firebaseError) {
      results.firebase.error = firebaseError.message;
    }
    
    // Check tables exist
    try {
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tk2namechanger_besidehorn'
      `);
      results.tables = tablesResult.rows.map((row: any) => row.table_name);
    } catch (tablesError) {
      results.tables_error = tablesError.message;
    }
    
    // Count suggestions
    try {
      const trackCountResult = await query('SELECT COUNT(*) as count FROM tk2namechanger_besidehorn.track_suggestions');
      const arenaCountResult = await query('SELECT COUNT(*) as count FROM tk2namechanger_besidehorn.arena_suggestions');
      
      results.counts = {
        tracks: parseInt(trackCountResult.rows[0].count),
        arenas: parseInt(arenaCountResult.rows[0].count)
      };
    } catch (countsError) {
      results.counts_error = countsError.message;
    }
    
    // Get a sample of suggestions if they exist
    if (results.counts.tracks > 0 || results.counts.arenas > 0) {
      const samples = [];
      
      if (results.counts.tracks > 0) {
        const trackSamples = await query('SELECT * FROM tk2namechanger_besidehorn.track_suggestions LIMIT 3');
        samples.push(...trackSamples.rows);
      }
      
      if (results.counts.arenas > 0) {
        const arenaSamples = await query('SELECT * FROM tk2namechanger_besidehorn.arena_suggestions LIMIT 3');
        samples.push(...arenaSamples.rows);
      }
      
      results.samples = samples;
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
