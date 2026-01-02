import { Hero } from '../components/Hero';
import { ValueProposition } from '../components/ValueProposition';
import { ExperiencesSection } from '../components/ExperiencesSection';
import { HowItWorks } from '../components/HowItWorks';
import { TrustSection } from '../components/TrustSection';
import { Testimonials } from '../components/Testimonials';
import { BecomeHostSection } from '../components/BecomeHostSection';
import { Footer } from '../components/Footer';

interface LandingPageProps {
  onExperienceSelect?: (id: string) => void;
}

export function LandingPage({ onExperienceSelect }: LandingPageProps) {
  return (
    <>
      <Hero />
      <ValueProposition />
      <ExperiencesSection onExperienceSelect={onExperienceSelect} />
      <HowItWorks />
      <TrustSection />
      <Testimonials />
      <BecomeHostSection />
      <Footer />
    </>
  );
}
