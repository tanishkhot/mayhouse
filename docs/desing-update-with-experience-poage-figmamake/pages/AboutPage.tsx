import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Heart, Users, Globe, Shield } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-20 lg:py-32 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
              Reimagining how we connect through travel
            </h1>
            <p className="text-xl text-muted-foreground">
              Mayhouse is more than a marketplace—it's a movement toward authentic human connection, 
              cultural preservation, and trust-powered experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-6">
                Our mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe travel should center human connection, authenticity, and trust—not volume or 
                transactional scale. Mayhouse curates micro-experiences that bring travelers and local 
                hosts together in intimate, culturally-rooted activities.
              </p>
              <p className="text-lg text-muted-foreground">
                From walking tours to food experiences, artisan workshops to cultural dives, every experience 
                on Mayhouse is hand-selected for quality, authenticity, and the human story behind it.
              </p>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1528605105345-5344ea20e269?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBjb25uZWN0aW9ufGVufDB8fHx8MTczMDgzNjE3MXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="People connecting through travel"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20 lg:py-32 bg-gradient-to-b from-white to-orange-50/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-6">
              What we stand for
            </h2>
            <p className="text-lg text-muted-foreground">
              Our values guide every decision we make and every experience we curate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-3">Authenticity</h3>
              <p className="text-muted-foreground">
                Real stories, real people, real cultural connections—not manufactured experiences.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-3">Intimacy</h3>
              <p className="text-muted-foreground">
                Small groups that foster genuine interaction and meaningful conversations.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-3">Trust</h3>
              <p className="text-muted-foreground">
                Web3-powered verification, blockchain reputation, and transparent reviews.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 mb-4">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-3">Curation</h3>
              <p className="text-muted-foreground">
                Quality over quantity—every experience is vetted for cultural depth and authenticity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Web3 Integration */}
      <div className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-6">
              Trust through technology
            </h2>
            <p className="text-lg text-muted-foreground">
              We integrate Web3 infrastructure to build trust and transparency, while maintaining 
              seamless user experience with fiat payment options.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl border bg-card">
              <h3 className="text-xl mb-3">Verified Hosts</h3>
              <p className="text-muted-foreground">
                Blockchain-based identity verification ensures every host is authentic and accountable.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card">
              <h3 className="text-xl mb-3">Reputation System</h3>
              <p className="text-muted-foreground">
                Immutable on-chain reputation that travels with hosts and travelers across platforms.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card">
              <h3 className="text-xl mb-3">Proof of Experience</h3>
              <p className="text-muted-foreground">
                Collectible tokens that commemorate your journeys and unlock exclusive benefits.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
