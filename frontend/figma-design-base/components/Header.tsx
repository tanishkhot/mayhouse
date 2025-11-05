import { useState } from 'react';
import { Menu, X, User, Heart, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface HeaderProps {
  onAuthStateChange?: (isAuthenticated: boolean) => void;
}

export function Header({ onAuthStateChange }: HeaderProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = () => {
    setIsAuthenticated(true);
    setIsAuthOpen(false);
    onAuthStateChange?.(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    onAuthStateChange?.(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500">
                  <span className="text-white">M</span>
                </div>
                <span className="text-xl">Mayhouse</span>
              </a>
              
              <nav className="hidden md:flex items-center gap-6">
                <a href="#experiences" className="text-muted-foreground hover:text-foreground transition-colors">
                  Experiences
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How it works
                </a>
                <a href="#hosts" className="text-muted-foreground hover:text-foreground transition-colors">
                  Become a host
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <Calendar className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>
                    <User className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsAuthOpen(true)}>
                  Sign in
                </Button>
              )}

              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <nav className="flex flex-col gap-4 mt-8">
                    <a href="#experiences" className="text-lg">
                      Experiences
                    </a>
                    <a href="#how-it-works" className="text-lg">
                      How it works
                    </a>
                    <a href="#hosts" className="text-lg">
                      Become a host
                    </a>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isLogin ? 'Welcome back' : 'Join Mayhouse'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full" onClick={handleAuth}>
              {isLogin ? 'Sign in' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                className="text-foreground underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
