'use client';

import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from './ImageWithFallback';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl">
                Travel deeper.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">
                  Connect authentically.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Discover curated micro-experiences led by local storytellers. 
                Beyond tourist checklists—immerse yourself in culture, community, and genuine human connection.
              </p>
            </div>

            <div className="flex justify-start">
              <Link href="/explore">
                <Button className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700">
                  Discover new stories
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-rose-500" />
                ))}
              </div>
              <div>
                <p className="text-sm">
                  Join <strong>12,000+ travelers</strong> who&apos;ve found
                  <br />
                  their most meaningful experiences
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1568492650629-3dfa9b007cbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBodW1hbiUyMGNvbm5lY3Rpb258ZW58MXx8fHwxNzYyMzYxNTcyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Authentic travel experiences"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Featured Host</p>
                    <h4>Maria&apos;s Hidden Barcelona</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm">⭐ 4.9</span>
                      <span className="text-sm text-muted-foreground">· 127 experiences</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

