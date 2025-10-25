'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { getAccessToken, clearAuthData } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Hide navbar on auth pages
  const hideNavbar = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    // Check if user has valid token
    const token = getAccessToken();
    setIsAuthenticated(!!token && isConnected);
  }, [isConnected, pathname]);

  const handleDisconnect = () => {
    clearAuthData();
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  // Show minimal navbar on auth pages
  if (hideNavbar) {
    return (
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 transition-all">
              Mayhouse ETH
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 transition-all">
              Mayhouse ETH
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {/* Explore Link */}
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Explore
            </Link>

            {isAuthenticated ? (
              <>
                {/* Create Experience Link */}
                <Link 
                  href="/design-experience" 
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold transition-colors"
                >
                  Create Experience
                </Link>

                {/* Host Dashboard Link */}
                <Link 
                  href="/host-dashboard" 
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  My Experiences
                </Link>

                {/* Profile Link */}
                <Link 
                  href="/profile" 
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Profile
                </Link>

                {/* Wallet Info & Disconnect */}
                <div className="flex items-center space-x-3">
                  <ConnectButton 
                    showBalance={false}
                    chainStatus="icon"
                    accountStatus={{
                      smallScreen: 'avatar',
                      largeScreen: 'full',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Connect Wallet Button */}
                <Link 
                  href="/login"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 font-medium shadow-md"
                >
                  Connect Wallet
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
