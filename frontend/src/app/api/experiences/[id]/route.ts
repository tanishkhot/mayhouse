import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { id } = await params;
    
    console.log(`🚀 FRONTEND API: GET /api/experiences/${id} called`);
    console.log('🔐 FRONTEND API: Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');

    const response = await fetch(`${BACKEND_URL}/experiences/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📨 FRONTEND API: Backend response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ FRONTEND API: Backend returned error:', response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ FRONTEND API: Success, returning experience data');
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');
    const { id } = await params;
    
    console.log(`🚀 FRONTEND API: PUT /api/experiences/${id} called`);
    console.log('📝 FRONTEND API: Request body keys:', Object.keys(body));
    console.log('🔐 FRONTEND API: Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');
    console.log('🌍 FRONTEND API: Backend URL:', `${BACKEND_URL}/experiences/${id}`);

    const response = await fetch(`${BACKEND_URL}/experiences/${id}`, {
      method: 'PUT',
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

    console.log('✅ FRONTEND API: Success, returning updated experience data');
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