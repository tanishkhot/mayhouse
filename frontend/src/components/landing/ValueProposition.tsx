'use client';

import { Shield, Users, Heart, Sparkles } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Human-first experiences',
    description: 'Every experience is designed to create genuine connections, not just photo opportunities. Feel belonging, not tourism.',
  },
  {
    icon: Users,
    title: 'Curated intimacy',
    description: 'Small groups, local hosts, and deeply rooted stories. We scale relationships, not crowds.',
  },
  {
    icon: Shield,
    title: 'Trust as infrastructure',
    description: 'Verified hosts, transparent reviews, secure payments, and blockchain-backed reputation. Your safety and confidence come first.',
  },
  {
    icon: Sparkles,
    title: 'Beyond transactions',
    description: 'Join a community where travelers and hosts share ownership, influence, and authentic cultural exchange.',
  },
];

export function ValueProposition() {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-4">
            Why Mayhouse is different
          </h2>
          <p className="text-lg text-muted-foreground">
            We&apos;re not just another booking platform. We&apos;re building a trust network 
            that reconnects people to place, story, and local authenticity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div key={value.title} className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center">
                <value.icon className="h-6 w-6 text-orange-600" />
              </div>
              <h3>{value.title}</h3>
              <p className="text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

