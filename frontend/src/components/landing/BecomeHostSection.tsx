'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Users, Briefcase } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import Link from 'next/link';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Earn meaningful income',
    description: 'Set your own prices and keep 70-80% of booking revenue. Top hosts earn $2,000+/month.',
  },
  {
    icon: Users,
    title: 'Build community',
    description: 'Connect with curious travelers who value your knowledge and authentic local perspective.',
  },
  {
    icon: Briefcase,
    title: 'Own your reputation',
    description: 'Your reviews and credentials are blockchain-verified and portable across platforms.',
  },
];

export function BecomeHostSection() {
  return (
    <section id="hosts" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1579603982264-d248efec97df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMGd1aWRlJTIwc3Rvcnl0ZWxsaW5nfGVufDF8fHx8MTc2MjM2MTU2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Become a Mayhouse host"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-terracotta-500 text-white rounded-2xl p-6 shadow-xl max-w-xs">
              <p className="text-3xl mb-1">$45-$85</p>
              <p className="text-sm opacity-90">Average host earnings per experience</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">
                Share your city.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-terracotta-600 to-terracotta-500">
                  Shape the future.
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Become a Mayhouse host and turn your local knowledge into meaningful 
                income while connecting travelers to your community&apos;s authentic stories.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-terracotta-100 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-terracotta-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1">{benefit.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/design-experience">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                  Apply to become a host
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline">
                Learn more
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div>
                <p className="text-2xl">500+</p>
                <p className="text-sm text-muted-foreground">Active hosts</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-2xl">42</p>
                <p className="text-sm text-muted-foreground">Cities worldwide</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-2xl">4.9★</p>
                <p className="text-sm text-muted-foreground">Avg. host rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

