'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import React, { useState, useEffect } from 'react';
import { getAccessToken, clearAuthData } from '@/lib/api';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Hide navbar on auth pages
  const hideNavbar = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    // Check if user has valid token
    const token = getAccessToken();
    // Use startTransition for non-blocking state updates
    React.startTransition(() => {
      setIsAuthenticated(!!token && isConnected);
    });
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
            {isAuthenticated ? (
              <>
                {/* Wallet Button */}
                <ConnectButton 
                  showBalance={false}
                  chainStatus="icon"
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                />

                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Menu"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-4 top-16 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link 
                      href="/design-experience"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition-colors"
                    >
                      🎨 Create Experience
                    </Link>
                    <Link 
                      href="/host-dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                      📋 My Experiences
                    </Link>
                    <Link 
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                      👤 Profile
                    </Link>
                  </div>
                )}
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
