import { setupDatabase } from '@/lib/db/setup';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await setupDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to initialize database',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({
      success: false,
      message: 'Error initializing database',
      error,
    }, { status: 500 });
  }
}