"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = () => {
      try {
        console.log('[OAUTH] frontend callback: start', {
          path: window.location.pathname,
          hasHash: Boolean(window.location.hash),
          hasQuery: Boolean(window.location.search),
        });
        // Extract token from hash fragment (more secure than query param)
        const hash = window.location.hash.substring(1); // Remove '#'
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const tokenType = params.get('token_type');
        const errorParam = params.get('error');

        // Check for OAuth errors
        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setIsProcessing(false);
          setTimeout(() => {
            router.replace('/login');
          }, 3000);
          return;
        }

        // Check for error in query params (fallback)
        const searchParams = new URLSearchParams(window.location.search);
        const queryError = searchParams.get('error');
        if (queryError) {
          setError(`Authentication failed: ${queryError}`);
          setIsProcessing(false);
          setTimeout(() => {
            router.replace('/login');
          }, 3000);
          return;
        }

        if (accessToken && tokenType === 'bearer') {
          // Store token
          setAccessToken(accessToken);
          console.log('[OAUTH] frontend callback: token stored, redirecting', {
            tokenType,
            tokenLen: accessToken.length,
          });
          
          // Redirect to homepage - use window.location for reliable redirect
          window.location.href = '/';
        } else {
          console.log('[OAUTH] frontend callback: missing token', {
            tokenType,
            hasAccessToken: Boolean(accessToken),
          });
          setError('No access token received');
          setIsProcessing(false);
          setTimeout(() => {
            router.replace('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Error processing OAuth callback:', err);
        setError('Failed to process authentication');
        setIsProcessing(false);
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    };

    processCallback();
  }, [router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terracotta-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-terracotta-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terracotta-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Authentication Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full bg-terracotta-500 text-white px-6 py-2 rounded-lg hover:bg-terracotta-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

