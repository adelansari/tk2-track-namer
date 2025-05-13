import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// This endpoint will run a direct query against a specific track or arena
// to check if we can retrieve suggestions directly
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'track'; // 'track' or 'arena'
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Missing id parameter'
      }, { status: 400 });
    }
    
    // Test database connection first
    const connectionResult = await query('SELECT NOW() as time');
    
    let table, idColumn;
    if (type === 'track') {
      table = 'track_suggestions';
      idColumn = 'track_id';
    } else {
      table = 'arena_suggestions';
      idColumn = 'arena_id';
    }
    
    // Run a direct query against the table
    const queryText = `
      SELECT * FROM ${table} 
      WHERE ${idColumn} = $1
      ORDER BY votes DESC, created_at DESC
      LIMIT 10
    `;
    
    const result = await query(queryText, [id]);
    
    return NextResponse.json({
      success: true,
      connection: {
        success: true,
        time: connectionResult.rows[0].time
      },
      query: {
        type,
        id,
        table,
        idColumn,
        text: queryText
      },
      result: {
        count: result.rows.length,
        items: result.rows
      }
    });
    
  } catch (error: any) {
    console.error('Direct query test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Query failed',
      error: error.message || String(error)
    }, { status: 500 });
  }
}
