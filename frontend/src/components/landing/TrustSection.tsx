'use client';

import { Shield, Lock, Award, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Verified hosts',
    description: 'Every host undergoes background checks, identity verification, and experience curation reviews.',
  },
  {
    icon: Lock,
    title: 'Secure escrow payments',
    description: 'Your payment is held securely until the experience is completed. Full refunds for cancellations.',
  },
  {
    icon: Award,
    title: 'Blockchain reputation',
    description: 'Reviews and attendance are anchored on-chain, creating portable, verifiable trust records.',
  },
  {
    icon: CheckCircle,
    title: 'Quality guarantee',
    description: 'If an experience doesn\'t meet our standards, we\'ll make it right or provide a full refund.',
  },
];

export function TrustSection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-orange-50 via-rose-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-rose-600 text-white">
                Trust Infrastructure
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">
                Built on trust, powered by technology
              </h2>
              <p className="text-lg text-muted-foreground">
                We combine rigorous human verification with blockchain technology 
                to create a platform you can trust completely.
              </p>
            </div>

            <div className="space-y-6">
              {trustFeatures.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1">{feature.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            <h3 className="text-center">What makes us different</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50">
                <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm mb-1 text-muted-foreground">Host verification rate</p>
                  <p className="text-2xl">100%</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50">
                <CheckCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm mb-1 text-muted-foreground">Average experience rating</p>
                  <p className="text-2xl">4.9/5.0</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50">
                <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm mb-1 text-muted-foreground">Traveler satisfaction</p>
                  <p className="text-2xl">98%</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm mb-1 text-muted-foreground">Successful completions</p>
                  <p className="text-2xl">12,000+</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Protected by smart contract escrow and 
                <br />
                community-governed reputation systems
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

