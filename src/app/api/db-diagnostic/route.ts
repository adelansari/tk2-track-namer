import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check current user
    const userResult = await query('SELECT current_user as username');
    const username = userResult.rows[0]?.username;
    
    // Check current schema search path
    const schemaResult = await query('SHOW search_path');
    const searchPath = schemaResult.rows[0]?.search_path;
    
    // Check available schemas
    const schemasResult = await query(`
      SELECT schema_name 
      FROM information_schema.schemata
      ORDER BY schema_name
    `);
    const schemas = schemasResult.rows.map(row => row.schema_name);
    
    // Check user permissions on schemas
    const permissionsResult = await query(`
      SELECT table_schema, privilege_type
      FROM information_schema.table_privileges 
      WHERE grantee = current_user
      GROUP BY table_schema, privilege_type
      ORDER BY table_schema, privilege_type
    `);
    
    return NextResponse.json({
      username,
      searchPath,
      schemas,
      permissions: permissionsResult.rows,
      message: 'Database diagnostic information retrieved'
    });
  } catch (error) {
    console.error('Database diagnostic error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database diagnostic failed',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}