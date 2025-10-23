'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AuthAPI, HostApplicationAPI, getAccessToken, getCachedHostStatus, getCachedUserRole, setCachedHostStatus, setCachedUserRole, clearAuthData } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isApprovedHost, setIsApprovedHost] = useState(false);
  const [checkingHostStatus, setCheckingHostStatus] = useState(false);
  
  // Hide navbar on auth pages
  const hideNavbar = pathname === '/login' || pathname === '/signup';

  const initializeAuthStatus = useCallback(async () => {
    const token = getAccessToken();
    setIsAuthenticated(!!token);
    
    if (token) {
      // Load cached values for instant display
      const cachedRole = getCachedUserRole();
      const cachedHostStatus = getCachedHostStatus();
      
      if (cachedRole) {
        setUserRole(cachedRole);
      }
      
      if (cachedHostStatus !== null) {
        setIsApprovedHost(cachedHostStatus);
      }
      
      // Refresh data in background
      checkAuthStatus();
    } else {
      setUserRole(null);
      setIsApprovedHost(false);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    if (!hideNavbar) {
      initializeAuthStatus();
    }
  }, [hideNavbar, initializeAuthStatus]);

  // Show minimal navbar on auth pages
  if (hideNavbar) {
    return (
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Link href="/" className="text-2xl font-bold text-red-500 hover:text-red-600 transition-colors">
              Mayhouse
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const checkAuthStatus = async () => {
    const token = getAccessToken();
    
    if (token) {
      try {
        const user = await AuthAPI.me();
        setUserRole(user.role);
        setCachedUserRole(user.role);
        
        // Check if user is an approved host
        if (user.role === 'user' || user.role === 'host') {
          setCheckingHostStatus(true);
          try {
            const isApproved = await HostApplicationAPI.isApprovedHost();
            setIsApprovedHost(isApproved);
            setCachedHostStatus(isApproved);
          } catch {
            // Don't update cached value on error
          } finally {
            setCheckingHostStatus(false);
          }
        } else {
          setIsApprovedHost(false);
          setCachedHostStatus(false);
        }
      } catch {
        // Clear auth data on error
        clearAuthData();
        setUserRole(null);
        setIsApprovedHost(false);
        setIsAuthenticated(false);
      }
    } else {
      setUserRole(null);
      setIsApprovedHost(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      setIsAuthenticated(false);
      setUserRole(null);
      setIsApprovedHost(false);
      window.location.href = '/';
    } catch {
      // Still clear local state even if logout fails
      clearAuthData();
      setIsAuthenticated(false);
      setUserRole(null);
      setIsApprovedHost(false);
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-red-500 hover:text-red-600 transition-colors">
              Mayhouse
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {/* Role-specific navigation */}
            {userRole === 'admin' ? (
              <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Admin Dashboard
              </Link>
            ) : !isApprovedHost && (
              <Link href="/become-host" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                {checkingHostStatus ? 'Checking...' : 'Become a Host'}
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                {/* Dashboard tab for approved hosts */}
                {isApprovedHost && (
                  <Link href="/host-dashboard" className="text-green-600 hover:text-green-800 font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                
                <Link href="/profile" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
