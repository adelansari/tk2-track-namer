import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time');
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].current_time,
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}