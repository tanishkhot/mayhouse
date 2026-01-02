import { useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Heart, Star, Clock, Users, CheckCircle2, MapPin, Calendar } from 'lucide-react';

const experiences = [
  {
    id: '1',
    title: 'Hidden Stories of the Gothic Quarter',
    host: { name: 'Maria Garcia', verified: true, avatar: 'MG', bio: 'Local historian and storyteller for 15+ years' },
    image: 'https://images.unsplash.com/photo-1761666520000-def67e58766e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxraW5nJTIwdG91cnxlbnwxfHx8fDE3NjIzNjE1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Culture',
    duration: '3 hours',
    groupSize: '6-8 people',
    price: 45,
    rating: 4.9,
    reviews: 127,
    location: 'Barcelona, Spain',
    description: 'Discover the hidden medieval lanes and untold stories of Barcelona\'s Gothic Quarter with a local historian. Visit secret courtyards, ancient Roman walls, and hear stories that shaped the city.',
    tags: ['History', 'Walking', 'Local insights'],
    dates: ['Nov 15', 'Nov 18', 'Nov 22'],
  },
  {
    id: '2',
    title: 'Authentic Vietnamese Street Food Journey',
    host: { name: 'Linh Nguyen', verified: true, avatar: 'LN', bio: 'Third-generation street food vendor and culinary guide' },
    image: 'https://images.unsplash.com/photo-1760049869567-e4ae462306f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMGZvb2QlMjBleHBlcmllbmNlfGVufDF8fHx8MTc2MjM2MTU3MHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Food',
    duration: '4 hours',
    groupSize: '4-6 people',
    price: 38,
    rating: 5.0,
    reviews: 89,
    location: 'Hanoi, Vietnam',
    description: 'Experience authentic Hanoi through its street food with a local vendor\'s daughter. Taste family recipes passed down for generations and learn the stories behind each dish.',
    tags: ['Culinary', 'Street food', 'Family recipes'],
    dates: ['Nov 16', 'Nov 19', 'Nov 23'],
  },
  {
    id: '3',
    title: 'Traditional Pottery Workshop with Local Artisan',
    host: { name: 'Yuki Tanaka', verified: true, avatar: 'YT', bio: 'Master potter preserving 400-year-old techniques' },
    image: 'https://images.unsplash.com/photo-1500472141701-084e6fa44840?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwd29ya3Nob3B8ZW58MXx8fHwxNzYyMzYxNTcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Arts',
    duration: '2.5 hours',
    groupSize: '3-5 people',
    price: 65,
    rating: 4.8,
    reviews: 54,
    location: 'Kyoto, Japan',
    description: 'Learn traditional Japanese pottery techniques in a 200-year-old workshop. Create your own ceramic piece using methods passed down through generations of artisans.',
    tags: ['Hands-on', 'Traditional craft', 'Artisan'],
    dates: ['Nov 17', 'Nov 20', 'Nov 24'],
  },
];

interface ExplorePageSimpleProps {
  onExperienceSelect?: (id: string) => void;
}

export function ExplorePageSimple({ onExperienceSelect }: ExplorePageSimpleProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl mb-4">Curated Local Experiences</h1>
            <p className="text-xl text-muted-foreground">
              Every experience on Mayhouse is hand-selected. We prioritize authenticity, quality, and meaningful human connection over volume.
            </p>
          </div>
        </div>
      </div>

      {/* Experiences List */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p className="text-muted-foreground">
              {experiences.length} {experiences.length === 1 ? 'experience' : 'experiences'} available
            </p>
          </div>

          <div className="space-y-8">
            {experiences.map((experience) => (
              <div 
                key={experience.id} 
                className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:border-ring"
              >
                <div className="grid md:grid-cols-5 gap-0">
                  {/* Image */}
                  <div className="md:col-span-2 relative aspect-[4/3] md:aspect-auto">
                    <ImageWithFallback
                      src={experience.image}
                      alt={experience.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(experience.id);
                      }}
                      className="absolute top-4 right-4 w-10 h-10 bg-background rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg border border-border"
                    >
                      <Heart
                        className={`h-5 w-5 transition-all duration-200 ${
                          favorites.has(experience.id)
                            ? 'fill-destructive text-destructive'
                            : 'text-foreground'
                        }`}
                      />
                    </button>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-background text-foreground hover:bg-background shadow-md border border-border">
                        {experience.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:col-span-3 p-6 md:p-8 flex flex-col">
                    {/* Location & Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{experience.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-chart-1 text-chart-1" />
                        <span>{experience.rating}</span>
                        <span className="text-sm text-muted-foreground">({experience.reviews} reviews)</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl mb-3">
                      {experience.title}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-4 flex-grow">
                      {experience.description}
                    </p>

                    {/* Host */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                      <Avatar className="h-12 w-12 bg-primary">
                        <AvatarFallback className="text-primary-foreground">
                          {experience.host.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <span>{experience.host.name}</span>
                          {experience.host.verified && (
                            <CheckCircle2 className="h-4 w-4 text-chart-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{experience.host.bio}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-5 w-5" />
                        <span>{experience.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <span>{experience.groupSize}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {experience.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Available Dates */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Upcoming dates:
                      </p>
                      <div className="flex gap-2">
                        {experience.dates.map((date) => (
                          <Badge key={date} variant="outline" className="bg-accent">
                            {date}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <span className="text-3xl">${experience.price}</span>
                        <span className="text-muted-foreground"> per person</span>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => onExperienceSelect?.(experience.id)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 active:scale-95"
                      >
                        Book Experience
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Message */}
          <div className="mt-12 p-8 bg-card rounded-xl border border-border text-center">
            <h3 className="text-2xl mb-3">More experiences coming soon</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We're carefully curating exceptional local experiences around the world. Each host is personally vetted to ensure authenticity and quality.
            </p>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.location.href = '/host/experiences'}
            >
              Become a Host
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}