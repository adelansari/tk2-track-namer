import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all suggestions for tracks and arenas with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';  // 'track', 'arena', 'all'
    const itemId = searchParams.get('itemId') || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    let queryText = '';
    let queryParams: any[] = [];
    let countQuery = '';
    
    if (type === 'track' || type === 'all') {
      queryText = `
        SELECT 
          ts.id, 
          ts.track_id as item_id, 
          ts.name, 
          ts.votes, 
          ts.created_at, 
          ts.updated_at,
          up.display_name as user_display_name,
          ts.user_id,
          'track' as type
        FROM track_suggestions ts
        LEFT JOIN user_profiles up ON ts.user_id = up.uid
      `;
      
      if (itemId) {
        queryText += ' WHERE ts.track_id = $1';
        queryParams.push(itemId);
      }
      
      if (type === 'all') {
        countQuery = `
          SELECT COUNT(*) as track_count FROM track_suggestions
          ${itemId ? ' WHERE track_id = $1' : ''}
        `;
      }
    }
    
    if (type === 'arena' || type === 'all') {
      const arenaQuery = `
        SELECT 
          as.id, 
          as.arena_id as item_id, 
          as.name, 
          as.votes, 
          as.created_at, 
          as.updated_at,
          up.display_name as user_display_name,
          as.user_id,
          'arena' as type
        FROM arena_suggestions as
        LEFT JOIN user_profiles up ON as.user_id = up.uid
      `;
      
      if (itemId) {
        if (type === 'arena') {
          queryText = arenaQuery + ' WHERE as.arena_id = $1';
          queryParams.push(itemId);
        } else {
          // For 'all' type with itemId, we need to handle both tables separately
          queryText = queryText + ' UNION ALL ' + arenaQuery + ' WHERE as.arena_id = $' + (queryParams.length + 1);
          queryParams.push(itemId);
        }
      } else {
        if (type === 'arena') {
          queryText = arenaQuery;
        } else {
          // For 'all' type without itemId, simply union both tables
          queryText = queryText + ' UNION ALL ' + arenaQuery;
        }
      }
      
      if (type === 'all') {
        const arenaCountQuery = `
          SELECT COUNT(*) as arena_count FROM arena_suggestions
          ${itemId ? ' WHERE arena_id = $1' : ''}
        `;
        countQuery = countQuery ? countQuery + '; ' + arenaCountQuery : arenaCountQuery;
      } else if (type === 'arena') {
        countQuery = `
          SELECT COUNT(*) as count FROM arena_suggestions
          ${itemId ? ' WHERE arena_id = $1' : ''}
        `;
      }
    }
    
    if (type === 'track') {
      countQuery = `
        SELECT COUNT(*) as count FROM track_suggestions
        ${itemId ? ' WHERE track_id = $1' : ''}
      `;
    }
    
    // Add order by and pagination
    queryText += ' ORDER BY votes DESC, created_at DESC';
    queryText += ' LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);
    
    // Execute the query
    const result = await query(queryText, queryParams);
    
    // Get total count for pagination
    let totalItems = 0;
    if (countQuery) {
      const countResult = await query(countQuery, itemId ? [itemId] : []);
      
      if (type === 'all') {
        totalItems = parseInt(countResult.rows[0].track_count || '0', 10) + 
                     parseInt(countResult.rows[1].arena_count || '0', 10);
      } else {
        totalItems = parseInt(countResult.rows[0].count || '0', 10);
      }
    }
    
    return NextResponse.json({
      success: true,
      suggestions: result.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// POST to create a new suggestion
export async function POST(request: NextRequest) {
  try {
    const { type, item_id, name, user_id } = await request.json();
    
    if (!type || !item_id || !name || !user_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (type !== 'track' && type !== 'arena') {
      return NextResponse.json(
        { success: false, message: 'Invalid suggestion type' },
        { status: 400 }
      );
    }
    
    // Check if user exists in profiles
    const userCheck = await query('SELECT * FROM user_profiles WHERE uid = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      // Create basic user profile if it doesn't exist
      await query(
        'INSERT INTO user_profiles (uid, display_name, email) VALUES ($1, $2, $3)',
        [user_id, 'Anonymous User', 'anonymous@example.com']
      );
    }
    
    // We're no longer checking if the user has already submitted a suggestion for this item
    // Multiple suggestions from the same user are now allowed
    
    let result;
    if (type === 'track') {
      result = await query(
        'INSERT INTO track_suggestions (track_id, user_id, name) VALUES ($1, $2, $3) RETURNING *',
        [item_id, user_id, name]
      );
    } else {
      // arena
      result = await query(
        'INSERT INTO arena_suggestions (arena_id, user_id, name) VALUES ($1, $2, $3) RETURNING *',
        [item_id, user_id, name]
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Suggestion created successfully',
      suggestion: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}