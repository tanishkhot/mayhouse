import { NextRequest, NextResponse } from 'next/server';

// Backend URL must be set via environment variable
// In production (Vercel), NEXT_PUBLIC_API_BASE_URL should be set to https://api.mayhouse.in
// In local dev, NEXT_PUBLIC_API_BASE_URL should be set to http://localhost:8000
function getBackendBaseUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!backendUrl) {
    // Only allow localhost fallback in development
    if (process.env.NODE_ENV === 'development') {
      const fallback = 'http://localhost:8000';
      console.warn('[PROXY] NEXT_PUBLIC_API_BASE_URL not set, using localhost fallback - set NEXT_PUBLIC_API_BASE_URL in .env.local');
      return fallback;
    } else {
      throw new Error('NEXT_PUBLIC_API_BASE_URL must be set in production');
    }
  }
  
  return backendUrl;
}

const BACKEND_BASE_URL = getBackendBaseUrl();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'DELETE');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'OPTIONS');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const fullPath = `${BACKEND_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    console.log(`[PROXY] ${method} ${url.pathname}${url.search ? url.search : ''} -> ${fullPath}`);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const body = method !== 'GET' && method !== 'DELETE' ? await request.text() : undefined;

    const response = await fetch(fullPath, {
      method,
      headers,
      body,
    });

    const data = await response.text();
    
    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch {
      responseData = data;
    }

    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...(response.headers.get('server-timing')
          ? { 'Server-Timing': response.headers.get('server-timing') as string }
          : {}),
        ...(response.headers.get('x-explore-server-ms')
          ? { 'X-Explore-Server-Ms': response.headers.get('x-explore-server-ms') as string }
          : {}),
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
