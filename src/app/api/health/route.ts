import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { adminAuth } from '@/lib/firebaseAdmin';

// This endpoint performs comprehensive health checks on all systems
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    databaseConnection: false,
    firebaseConnection: false,
    searchPathStatus: false
  };
  
  try {
    // Test basic DB connection
    const dbResult = await query('SELECT NOW() as time');
    results.databaseConnection = {
      success: true, 
      message: "Database is connected",
      timestamp: dbResult.rows[0].time
    };
    
    // Test search_path setting
    try {
      await query('SET search_path TO tk2namechanger_besidehorn');
      const schemaTest = await query('SELECT current_schema() as schema');
      results.searchPathStatus = {
        success: true,
        schema: schemaTest.rows[0].schema
      };
    } catch (searchPathError: any) {
      results.searchPathStatus = {
        success: false,
        message: "Failed to set search path",
        error: searchPathError.message
      };
    }
    
    // Test table access
    try {
      // Check if tables exist and contain data
      const tables = [
        { name: 'track_suggestions', query: 'SELECT COUNT(*) as count FROM track_suggestions' },
        { name: 'arena_suggestions', query: 'SELECT COUNT(*) as count FROM arena_suggestions' },
        { name: 'user_votes', query: 'SELECT COUNT(*) as count FROM user_votes' }
      ];
      
      results.tables = {};
      
      for (const table of tables) {
        try {
          const tableResult = await query(table.query);
          results.tables[table.name] = {
            exists: true,
            count: parseInt(tableResult.rows[0].count)
          };
          
          // Sample data
          if (results.tables[table.name].count > 0) {
            const sampleResult = await query(`SELECT * FROM ${table.name} LIMIT 1`);
            results.tables[table.name].sample = sampleResult.rows[0];
          }
          
        } catch (tableError: any) {
          results.tables[table.name] = {
            exists: false,
            error: tableError.message
          };
        }
      }
    } catch (tableAccessError: any) {
      results.tableAccess = {
        success: false,
        message: "Failed to access tables",
        error: tableAccessError.message
      };
    }
    
    // Test Firebase connection
    try {
      // Try to list a single user to test Firebase connection
      const firebaseResult = await adminAuth.listUsers(1);
      results.firebaseConnection = {
        success: true,
        message: "Firebase Admin SDK is connected"
      };
      
      // If users were returned, include count
      if (firebaseResult.users.length > 0) {
        results.firebaseConnection.users = firebaseResult.users.length;
      }
    } catch (firebaseError: any) {
      results.firebaseConnection = {
        success: false,
        message: "Firebase Admin SDK connection failed",
        error: firebaseError.message
      };
    }
    
    // Overall system status
    results.systemStatus = {
      allGood: results.databaseConnection.success && 
               results.searchPathStatus.success &&
               results.firebaseConnection.success
    };
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      success: false,
      message: "Health check failed",
      error: error.message || String(error)
    }, { status: 500 });
  }
}
