import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUsersDisplayNames } from '@/lib/firebaseAdmin';

// GET all suggestions for tracks and arenas with pagination
export async function GET(request: NextRequest) {
  try {    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';  // 'track', 'arena', 'all'
    const itemId = searchParams.get('itemId') || null;
    const itemIds = searchParams.getAll('itemIds'); // For batch counts
    const countsOnly = searchParams.get('countsOnly') === 'true'; // For batch counts
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    const offset = (page - 1) * limit;

    console.log('API Request params:', { type, itemId, itemIds, countsOnly, page, limit, offset });

    let queryText = '';
    let queryParams: any[] = [];
    let countQuery = '';
    
    if (countsOnly && itemIds.length > 0) {
      // Handle batch fetching of suggestion counts
      const counts: { [key: string]: number } = {};
      let countBaseQueryText = '';
      let idColumnName = '';

      if (type === 'track') {
        countBaseQueryText = 'SELECT track_id, COUNT(*) as count FROM track_suggestions WHERE track_id = ANY($1::text[]) GROUP BY track_id';
        idColumnName = 'track_id';
      } else if (type === 'arena') {
        countBaseQueryText = 'SELECT arena_id, COUNT(*) as count FROM arena_suggestions WHERE arena_id = ANY($1::text[]) GROUP BY arena_id';
        idColumnName = 'arena_id';
      } else {
        return NextResponse.json({ error: 'Invalid type for batch counts' }, { status: 400 });
      }

      const result = await query(countBaseQueryText, [itemIds]);
      result.rows.forEach((row: any) => {
        counts[row[idColumnName]] = parseInt(row.count, 10);
      });
      // Ensure all requested itemIds have a count, even if 0
      itemIds.forEach(id => {
        if (!counts[id]) {
          counts[id] = 0;
        }      });
      return NextResponse.json({ counts }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
    
    if (type === 'track' || type === 'all') {      queryText = `
        SELECT 
          ts.id, 
          ts.track_id as item_id, 
          ts.name, 
          ts.votes, 
          ts.created_at, 
          ts.updated_at,
          ts.user_id,
          'track' as type
        FROM track_suggestions ts
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
    
    if (type === 'arena' || type === 'all') {      const arenaQuery = `
        SELECT 
          arena_sugg.id, 
          arena_sugg.arena_id as item_id, 
          arena_sugg.name, 
          arena_sugg.votes, 
          arena_sugg.created_at, 
          arena_sugg.updated_at,
          arena_sugg.user_id,
          'arena' as type
        FROM arena_suggestions arena_sugg
      `;
      
      if (itemId) {
        if (type === 'arena') {
          queryText = arenaQuery + ' WHERE arena_sugg.arena_id = $1';
          queryParams.push(itemId);
        } else {
          // For 'all' type with itemId, we need to handle both tables separately
          queryText = queryText + ' UNION ALL ' + arenaQuery + ' WHERE arena_sugg.arena_id = $' + (queryParams.length + 1);
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
        if (type === 'arena') {
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
      // Add order by and pagination - sort by newest first, then by votes
    queryText += ' ORDER BY created_at DESC, votes DESC';
    queryText += ' LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);
      // Execute the query
    const result = await query(queryText, queryParams);
    
    // Get user display names from Firebase if there are results
    if (result.rows.length > 0) {
      // Extract unique user IDs from suggestions
      const userIds = result.rows.map((suggestion: any) => suggestion.user_id);
      
      // Fetch display names from Firebase
      const displayNames = await getUsersDisplayNames(userIds);
      
      // Add display names to suggestions
      result.rows.forEach((row: any) => {
        row.user_display_name = displayNames.get(row.user_id) || 'Anonymous User';
      });
    }
      // Get total count for pagination
    let totalItems = 0;
    if (type === 'all') {
      // For 'all' type, we need to count both tables separately
      const trackCountResult = await query(
        `SELECT COUNT(*) as count FROM track_suggestions${itemId ? ' WHERE track_id = $1' : ''}`,
        itemId ? [itemId] : []
      );
      const arenaCountResult = await query(
        `SELECT COUNT(*) as count FROM arena_suggestions${itemId ? ' WHERE arena_id = $1' : ''}`,
        itemId ? [itemId] : []
      );
      
      totalItems = parseInt(trackCountResult.rows[0].count || '0', 10) + 
                   parseInt(arenaCountResult.rows[0].count || '0', 10);
    } else if (countQuery) {
      const countResult = await query(countQuery, itemId ? [itemId] : []);
      totalItems = parseInt(countResult.rows[0].count || '0', 10);
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
      // We don't need to check user profiles anymore as we're using Firebase Auth
    // The Firebase user ID validation will happen naturally - if an invalid ID is provided,
    // the suggestion will still be created but the display name will fall back to 'Anonymous User'
    
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