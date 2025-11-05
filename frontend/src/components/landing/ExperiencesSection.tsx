'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExploreAPI, ExploreEventRun } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Clock, Shield, Star } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import Link from 'next/link';
import PriceDisplay from '@/components/PriceDisplay';

const categories = ['All', 'Culture', 'Food', 'Arts', 'Nature'];

interface ExperiencesSectionProps {
  onExperienceSelect?: (id: string) => void;
}

export function ExperiencesSection({ onExperienceSelect }: ExperiencesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: eventRuns = [], isLoading } = useQuery({
    queryKey: ['explore'],
    queryFn: () => ExploreAPI.getUpcomingExperiences({ limit: 6 }),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Filter experiences (you can enhance this based on actual category data)
  const filteredExperiences = selectedCategory === 'All' 
    ? eventRuns 
    : eventRuns.filter((exp) => {
        // This is a placeholder - adjust based on your actual category structure
        return true; // For now, show all
      });

  return (
    <section id="experiences" className="py-20 lg:py-32 bg-gradient-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-4 font-bold">
            Curated experiences
          </h2>
          <p className="text-lg text-muted-foreground">
            Each experience is hand-selected for authenticity, intimacy, and cultural depth. 
            Meet the humans behind the place.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-white shadow-sm">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredExperiences.slice(0, 6).map((experience) => (
                <Card 
                  key={experience.id}
                  className="group overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="relative">
                    <ImageWithFallback
                      src={experience.experience?.image_url || 'https://images.unsplash.com/photo-1568492650629-3dfa9b007cbf?w=800'}
                      alt={experience.experience?.title || 'Experience'}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="h-5 w-5" />
                    </button>
                    <Badge className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-foreground hover:bg-white">
                      {experience.experience?.domain || 'Experience'}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">{experience.neighborhood || experience.experience?.location}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                          <span className="text-sm">4.9</span>
                        </div>
                      </div>
                      <Link href={`/experiences/${experience.experience_id}/runs/${experience.id}`}>
                        <h3 className="line-clamp-2 mb-3 font-semibold hover:text-orange-600 transition-colors">
                          {experience.experience?.title || 'Experience'}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm truncate">{experience.experience?.host_name || 'Host'}</p>
                            <Shield className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(experience.experience?.duration_minutes || 120)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{experience.max_participants || '6-8'} people</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <PriceDisplay amount={experience.price_per_person || '0'} />
                        <span className="text-sm text-muted-foreground"> per person</span>
                      </div>
                      <Link href={`/experiences/${experience.experience_id}/runs/${experience.id}`}>
                        <Button size="sm" className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700">
                          Book now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="text-center">
          <Link href="/explore">
            <Button variant="outline" size="lg">
              View all experiences
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

