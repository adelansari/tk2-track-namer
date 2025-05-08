import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This route handler will serve static files from the src/assets directory
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug || [];
  const assetPath = path.join(process.cwd(), 'src', 'assets', ...slug);
  
  try {
    const fileBuffer = fs.readFileSync(assetPath);
    
    // Determine content type based on file extension
    const extension = path.extname(assetPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (extension === '.jpg' || extension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === '.png') {
      contentType = 'image/png';
    } else if (extension === '.gif') {
      contentType = 'image/gif';
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for a year
      },
    });
  } catch (error) {
    return new NextResponse(`File not found: ${assetPath}`, {
      status: 404,
    });
  }
}