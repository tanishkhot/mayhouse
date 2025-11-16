import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ValueProposition } from './components/ValueProposition';
import { ExperiencesSection } from './components/ExperiencesSection';
import { HowItWorks } from './components/HowItWorks';
import { TrustSection } from './components/TrustSection';
import { BecomeHostSection } from './components/BecomeHostSection';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { ExperienceDetail } from './components/ExperienceDetail';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {selectedExperience ? (
        <ExperienceDetail onClose={() => setSelectedExperience(null)} />
      ) : (
        <>
          <Hero />
          <ValueProposition />
          <ExperiencesSection onExperienceSelect={setSelectedExperience} />
          <HowItWorks />
          <TrustSection />
          <Testimonials />
          <BecomeHostSection />
          <Footer />
        </>
      )}
      
      <Toaster />
    </div>
  );
}
