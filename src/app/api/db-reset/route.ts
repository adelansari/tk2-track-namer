import { query } from '@/lib/db';
import { setupDatabase } from '@/lib/db/setup';
import { NextResponse } from 'next/server';

// Completely drops and recreates all tables
export async function GET() {
  try {
    // First set the search path
    await query(`SET search_path TO tk2namechanger_besidehorn`);
    console.log("Search path set to tk2namechanger_besidehorn");
    
    // Drop existing tables in the correct order (to avoid foreign key constraints)
    try {
      console.log("Dropping tables if they exist...");
      await query(`DROP TABLE IF EXISTS user_votes CASCADE`);
      await query(`DROP TABLE IF EXISTS track_suggestions CASCADE`);
      await query(`DROP TABLE IF EXISTS arena_suggestions CASCADE`);
      await query(`DROP TABLE IF EXISTS user_profiles CASCADE`);
      console.log("Tables dropped successfully");
    } catch (dropError) {
      console.error("Error dropping tables:", dropError);
      // Continue anyway as the tables might not exist
    }
    
    // Now recreate all tables with the updated schema
    console.log("Setting up database tables...");
    const result = await setupDatabase();
    
    if (!result.success) {
      console.error("Failed to set up database:", result.error);
      return NextResponse.json({
        success: false,
        message: 'Failed to reset database',
        error: result.error
      }, { status: 500 });
    }
    
    // Verify tables were created
    console.log("Verifying tables were created...");
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'tk2namechanger_besidehorn' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = tableCheck.rows.map(row => row.table_name);
    console.log("Tables found:", tables);
    
    // Make sure all required tables exist
    const requiredTables = ['user_profiles', 'track_suggestions', 'arena_suggestions', 'user_votes'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.error("Missing tables:", missingTables);
      return NextResponse.json({
        success: false,
        message: `Missing required tables: ${missingTables.join(', ')}`,
        tables: tables
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database reset successfully',
      tables: tables
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({
      success: false,
      message: 'Error resetting database',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}