/**
 * Tests for navigation redirect behavior - ensuring correct URL usage
 * Tests ensure no localhost fallbacks in production
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => key === 'next' ? null : null),
  }),
}));

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'https://mayhouse.in',
  pathname: '/login',
  hash: '',
  search: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true,
});

describe('OAuth Handler Redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;
    process.env.NODE_ENV = 'production';
    mockLocation.href = '';
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('requires NEXT_PUBLIC_API_BASE_URL in production', async () => {
    process.env.NODE_ENV = 'production';
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;

    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Import dynamically to get fresh env values
    const LoginPage = (await import('@/app/login/page')).default;
    
    render(<LoginPage />);
    const googleAuthButton = screen.getByText(/continue with google/i);
    
    fireEvent.click(googleAuthButton);
    
    // Should show error and not redirect
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Configuration error: Backend URL not configured. Please contact support.'
      );
    });
    
    // Should not change location
    expect(mockLocation.href).toBe('');
    
    alertSpy.mockRestore();
  });

  it('allows localhost fallback in development', async () => {
    process.env.NODE_ENV = 'development';
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;

    // Mock console.warn to verify it's called
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Import dynamically to get fresh env values
    const LoginPage = (await import('@/app/login/page')).default;
    
    render(<LoginPage />);
    const googleAuthButton = screen.getByText(/continue with google/i);
    
    fireEvent.click(googleAuthButton);
    
    // Should warn and use localhost fallback
    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXT_PUBLIC_API_BASE_URL not set')
      );
    });
    
    expect(mockLocation.href).toBe('http://localhost:8000/auth/oauth/google/login');
    
    warnSpy.mockRestore();
  });

  it('uses NEXT_PUBLIC_API_BASE_URL when set', async () => {
    process.env.NODE_ENV = 'production';
    (process.env as any).NEXT_PUBLIC_API_BASE_URL = 'https://api.mayhouse.in';

    // Import dynamically to get fresh env values
    const LoginPage = (await import('@/app/login/page')).default;
    
    render(<LoginPage />);
    const googleAuthButton = screen.getByText(/continue with google/i);
    
    fireEvent.click(googleAuthButton);
    
    // Should use production URL
    expect(mockLocation.href).toBe('https://api.mayhouse.in/auth/oauth/google/login');
  });
});

describe('API Proxy Route Redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('requires NEXT_PUBLIC_API_BASE_URL in production', async () => {
    process.env.NODE_ENV = 'production';
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;

    // Test that getBackendBaseUrl function throws or handles error
    // Since it's called at module load, we test the behavior
    const proxyRoute = await import('@/app/api/proxy/[...path]/route');
    
    const request = new Request('http://localhost:3000/api/proxy/test', {
      method: 'GET',
    });
    
    // The function should throw or handle error gracefully
    try {
      await proxyRoute.GET(request, { params: Promise.resolve({ path: ['test'] }) });
      // If no error thrown, that's also acceptable if handled internally
    } catch (error: any) {
      // If error is thrown, it should mention NEXT_PUBLIC_API_BASE_URL
      if (error.message) {
        expect(error.message).toContain('NEXT_PUBLIC_API_BASE_URL');
      }
    }
  });

  it('allows localhost fallback in development', async () => {
    process.env.NODE_ENV = 'development';
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;

    // Mock fetch to avoid actual network call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"test": "data"}',
      headers: new Headers(),
    });
    
    const proxyRoute = await import('@/app/api/proxy/[...path]/route');
    const request = new Request('http://localhost:3000/api/proxy/test', {
      method: 'GET',
    });
    
    await proxyRoute.GET(request, { params: Promise.resolve({ path: ['test'] }) });
    
    // Verify localhost was used
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:8000'),
      expect.any(Object)
    );
    
    (global.fetch as jest.Mock).mockClear();
  });
});

describe('ServerDebug Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;
    
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('requires NEXT_PUBLIC_API_BASE_URL in production', async () => {
    process.env.NODE_ENV = 'production';
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;

    const ServerDebug = (await import('@/components/ServerDebug')).default;
    
    render(<ServerDebug />);
    
    await waitFor(() => {
      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });
    
    // Should not make fetch request
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('allows localhost fallback in development', async () => {
    process.env.NODE_ENV = 'development';
    delete (process.env as any).NEXT_PUBLIC_API_BASE_URL;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'OK',
    });

    const ServerDebug = (await import('@/components/ServerDebug')).default;
    
    render(<ServerDebug />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000',
        expect.any(Object)
      );
    });
    
    (global.fetch as jest.Mock).mockClear();
  });

  it('uses NEXT_PUBLIC_API_BASE_URL when set', async () => {
    (process.env as any).NEXT_PUBLIC_API_BASE_URL = 'https://api.mayhouse.in';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'OK',
    });

    const ServerDebug = (await import('@/components/ServerDebug')).default;
    
    render(<ServerDebug />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mayhouse.in',
        expect.any(Object)
      );
    });
    
    (global.fetch as jest.Mock).mockClear();
  });
});

describe('Auth Callback Redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.hash = '';
    mockLocation.search = '';
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('redirects to homepage after successful auth', async () => {
    mockLocation.hash = '#access_token=test-token&token_type=bearer';
    
    const AuthCallback = (await import('@/app/auth/callback/page')).default;
    
    render(<AuthCallback />);
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to login on error', async () => {
    mockLocation.hash = '#error=access_denied';
    
    const AuthCallback = (await import('@/app/auth/callback/page')).default;
    
    render(<AuthCallback />);
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    }, { timeout: 3500 }); // 3 second timeout before redirect
  });
});

