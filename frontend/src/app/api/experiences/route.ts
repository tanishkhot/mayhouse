import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    console.log('🚀 FRONTEND API: POST /api/experiences called');
    console.log('📝 FRONTEND API: Request body keys:', Object.keys(body));
    console.log('🔐 FRONTEND API: Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');
    console.log('🌍 FRONTEND API: Backend URL:', `${BACKEND_URL}/experiences`);

    const response = await fetch(`${BACKEND_URL}/experiences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    });
    
    console.log('📨 FRONTEND API: Backend response status:', response.status);
    console.log('📨 FRONTEND API: Backend response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📨 FRONTEND API: Backend response data:', data);

    if (!response.ok) {
      console.log('❌ FRONTEND API: Backend returned error:', response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ FRONTEND API: Success, returning data to frontend');
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.log('💥 FRONTEND API: Error occurred:', error);
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();

    const response = await fetch(`${BACKEND_URL}/experiences?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}