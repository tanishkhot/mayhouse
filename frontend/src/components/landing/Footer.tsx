'use client';

import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="mb-4 font-semibold">Explore</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Experiences</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Cities</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Top hosts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Hosting</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/design-experience" className="hover:text-foreground transition-colors">Become a host</Link></li>
              <li><Link href="/host-dashboard" className="hover:text-foreground transition-colors">Host resources</Link></li>
              <li><Link href="/host-dashboard" className="hover:text-foreground transition-colors">Community forum</Link></li>
              <li><Link href="/host-dashboard" className="hover:text-foreground transition-colors">Host stories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Trust & Safety</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/host/homes#how-it-works" className="hover:text-foreground transition-colors">How we verify hosts</Link></li>
              <li><Link href="/host/homes#hosts" className="hover:text-foreground transition-colors">Blockchain reputation</Link></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cancellation policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Safety guidelines</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Mayhouse</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Our vision</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500">
              <span className="text-white font-bold">M</span>
            </div>
            <Link href="/host/homes" className="text-xl font-semibold">
              Mayhouse
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mt-8 pt-8 border-t gap-4 text-sm text-muted-foreground">
          <p>© 2025 Mayhouse. Building trust through human connection.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

