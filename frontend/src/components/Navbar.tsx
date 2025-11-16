'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import React, { useState, useEffect } from 'react';
import { getAccessToken, clearAuthData } from '@/lib/api';
import { Menu, X, User, Heart, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Check if we're on landing page (host/experiences)
  const isLandingPage = pathname === '/host/experiences';
  const hideNavbar = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    // Check if user has valid token
    const token = getAccessToken();
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-semibold">Mayhouse</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href={isLandingPage ? '/host/experiences' : '/'} className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 group-hover:from-orange-500 group-hover:to-rose-600 transition-colors">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-semibold leading-tight">Mayhouse</span>
                {isLandingPage && (
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Travel deeper. Connect authentically.
                  </span>
                )}
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            {isLandingPage ? (
              <nav className="hidden md:flex items-center gap-6">
                <a 
                  href="#experiences" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Experiences
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  How it works
                </a>
                <a 
                  href="#hosts" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Become a host
                </a>
                <Link 
                  href="/explore" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Browse
                </Link>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/host/experiences" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  About
                </Link>
                {isAuthenticated && (
                  <>
                    <Link 
                      href="/design-experience" 
                      onClick={() => {
                        try {
                          console.log('[FLOW] Navbar Host link clicked', { from: pathname, to: '/design-experience', ts: new Date().toISOString() });
                        } catch {}
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      Host
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Desktop: User Menu */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/explore">
                      <Heart className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                      <Calendar className="h-5 w-5" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {address?.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <span className="hidden lg:inline">Account</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/host-dashboard" onClick={() => { try { console.log('[FLOW] Account menu -> My Experiences', { from: pathname, to: '/host-dashboard', ts: new Date().toISOString() }); } catch {} }}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          My Experiences
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/design-experience" onClick={() => { try { console.log('[FLOW] Account menu -> Create Experience', { from: pathname, to: '/design-experience', ts: new Date().toISOString() }); } catch {} }}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Experience
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDisconnect}>
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile: Wallet + Menu */}
                <div className="sm:hidden flex items-center gap-2">
                  <ConnectButton 
                    showBalance={false}
                    chainStatus="icon"
                    accountStatus="avatar"
                  />
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <nav className="flex flex-col gap-4 mt-8">
                        <Link 
                          href="/host/experiences"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-medium"
                        >
                          About
                        </Link>
                        <Link 
                          href="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-medium"
                        >
                          Profile
                        </Link>
                        <Link 
                          href="/host-dashboard"
                          onClick={() => { try { console.log('[FLOW] Mobile menu -> My Experiences', { from: pathname, to: '/host-dashboard', ts: new Date().toISOString() }); } catch {} ; setIsMenuOpen(false); }}
                          className="text-lg font-medium"
                        >
                          My Experiences
                        </Link>
                        <Link 
                          href="/design-experience"
                          onClick={() => { try { console.log('[FLOW] Mobile menu -> Create Experience', { from: pathname, to: '/design-experience', ts: new Date().toISOString() }); } catch {} ; setIsMenuOpen(false); }}
                          className="text-lg font-medium"
                        >
                          Create Experience
                        </Link>
                        <div className="pt-4 border-t">
                          <button
                            onClick={() => {
                              handleDisconnect();
                              setIsMenuOpen(false);
                            }}
                            className="text-lg font-medium text-destructive"
                          >
                            Sign out
                          </button>
                        </div>
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <>
                {/* Not Authenticated */}
                {!isLandingPage && (
                  <Link href="/login">
                    <Button 
                      variant="default"
                      className="bg-black hover:bg-gray-900 text-white"
                    >
                      Sign in
                    </Button>
                  </Link>
                )}
                
                {/* Mobile Menu for Landing Page */}
                {isLandingPage && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <nav className="flex flex-col gap-4 mt-8">
                        <a 
                          href="#experiences"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-medium"
                        >
                          Experiences
                        </a>
                        <a 
                          href="#how-it-works"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-medium"
                        >
                          How it works
                        </a>
                        <a 
                          href="#hosts"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-medium"
                        >
                          Become a host
                        </a>
                        <Link 
                          href="/explore"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-medium"
                        >
                          Browse
                        </Link>
                        <div className="pt-4 border-t">
                          <Link href="/login">
                            <Button 
                              variant="default"
                              className="w-full bg-black hover:bg-gray-900 text-white"
                            >
                              Sign in
                            </Button>
                          </Link>
                        </div>
                      </nav>
                    </SheetContent>
                  </Sheet>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
