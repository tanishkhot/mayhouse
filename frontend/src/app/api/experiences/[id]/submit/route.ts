import { NextRequest, NextResponse } from 'next/server';

// Backend URL must be set via environment variable
function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!backendUrl) {
    // Only allow localhost fallback in development
    if (process.env.NODE_ENV === 'development') {
      const fallback = 'http://localhost:8000';
      console.warn('[EXPERIENCES SUBMIT API] NEXT_PUBLIC_API_BASE_URL not set, using localhost fallback - set NEXT_PUBLIC_API_BASE_URL in .env.local');
      return fallback;
    } else {
      throw new Error('NEXT_PUBLIC_API_BASE_URL must be set in production');
    }
  }
  
  return backendUrl;
}

const BACKEND_URL = getBackendUrl();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');
    const { id: experienceId } = await params;

    console.log('🚀 FRONTEND API: POST /api/experiences/:id/submit called');
    console.log('🚀 FRONTEND API: Experience ID:', experienceId);
    console.log('🔐 FRONTEND API: Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');

    const response = await fetch(`${BACKEND_URL}/experiences/${experienceId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    });

    console.log('📨 FRONTEND API: Backend response status:', response.status);

    const data = await response.json();
    console.log('📨 FRONTEND API: Backend response data:', data);

    if (!response.ok) {
      console.log('❌ FRONTEND API: Backend returned error:', response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ FRONTEND API: Experience submitted successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.log('💥 FRONTEND API: Error occurred:', error);
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}