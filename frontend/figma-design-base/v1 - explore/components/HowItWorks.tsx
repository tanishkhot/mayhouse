import { Search, UserCheck, Calendar, Star } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Browse curated micro-experiences in cities around the world. Filter by interest, location, or host.',
  },
  {
    icon: UserCheck,
    title: 'Connect',
    description: 'Read host stories, reviews, and credentials. Every host is verified and background-checked for your safety.',
  },
  {
    icon: Calendar,
    title: 'Book securely',
    description: 'Reserve your spot with secure escrow payments. Your funds are protected until the experience is complete.',
  },
  {
    icon: Star,
    title: 'Experience & share',
    description: 'Immerse yourself in authentic moments. Share your story and earn proof-of-attendance tokens.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-4">
            How Mayhouse works
          </h2>
          <p className="text-lg text-muted-foreground">
            Trust, transparency, and human connection are built into every step of your journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-orange-200 to-rose-200" />
              )}
              <div className="relative space-y-4 text-center">
                <div className="relative inline-flex">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center mx-auto">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                </div>
                <h3>{step.title}</h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
