'use client';

import { Hero } from '@/components/landing/Hero';
import { ValueProposition } from '@/components/landing/ValueProposition';
import { ExperiencesSection } from '@/components/landing/ExperiencesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustSection } from '@/components/landing/TrustSection';
import { BecomeHostSection } from '@/components/landing/BecomeHostSection';
import { Testimonials } from '@/components/landing/Testimonials';
import { Footer } from '@/components/landing/Footer';

export default function HostHomesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ValueProposition />
      <ExperiencesSection />
      <HowItWorks />
      <TrustSection />
      <Testimonials />
      <BecomeHostSection />
      <Footer />
    </div>
  );
}

