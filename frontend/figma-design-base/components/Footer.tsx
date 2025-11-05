import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="mb-4">Explore</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Experiences</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cities</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Categories</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Top hosts</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Hosting</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Become a host</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Host resources</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Community forum</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Host stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Trust & Safety</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">How we verify hosts</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blockchain reputation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cancellation policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Safety guidelines</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Company</h4>
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
              <span className="text-white">M</span>
            </div>
            <span className="text-xl">Mayhouse</span>
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
