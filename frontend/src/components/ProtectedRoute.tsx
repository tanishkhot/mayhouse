'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI, getAccessToken } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'host' | 'user';
  fallbackPath?: string;
  skeleton?: React.ReactNode; // Optional skeleton loader for the page
}

export default function ProtectedRoute({
  children,
  requiredRole = 'user',
  fallbackPath = '/login',
  skeleton
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Check if user has token
      const token = getAccessToken();
      if (!token) {
        console.log('No token found, redirecting to login');
        router.replace('/login');
        return;
      }

      // Verify token and get user data
      const user = await AuthAPI.me();
      console.log('Current user role:', user.role);
      console.log('Required role:', requiredRole);

      // Check if user has required role
      if (requiredRole === 'admin' && user.role !== 'admin') {
        console.log('Access denied: Admin role required');
        setError('Access denied. Administrator privileges required.');
        setAuthorized(false);
        // Redirect non-admin users trying to access admin routes
        setTimeout(() => {
          router.replace('/');
        }, 2000);
        return;
      }

      if (requiredRole === 'host' && !['host', 'admin'].includes(user.role)) {
        console.log('Access denied: Host role required');
        setError('Access denied. Host privileges required.');
        setAuthorized(false);
        setTimeout(() => {
          router.replace('/');
        }, 2000);
        return;
      }

      // User is authorized
      console.log('Access granted for role:', user.role);
      setAuthorized(true);

    } catch (err: unknown) {
      console.error('Auth check failed:', err);

      if (err instanceof Error && (err.message?.includes('401') || err.message?.includes('authentication'))) {
        // Token invalid or expired
        router.replace('/login');
      } else {
        setError('Authentication verification failed. Please try again.');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [router, requiredRole]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    // Use custom skeleton if provided, otherwise use default loading screen
    if (skeleton) {
      return <>{skeleton}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">You will be redirected automatically...</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnlyRoute({ 
  children, 
  skeleton 
}: { 
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin" fallbackPath="/" skeleton={skeleton}>
      {children}
    </ProtectedRoute>
  );
}

export function HostOnlyRoute({ 
  children, 
  skeleton 
}: { 
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="host" fallbackPath="/" skeleton={skeleton}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ 
  children, 
  skeleton 
}: { 
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="user" fallbackPath="/login" skeleton={skeleton}>
      {children}
    </ProtectedRoute>
  );
}