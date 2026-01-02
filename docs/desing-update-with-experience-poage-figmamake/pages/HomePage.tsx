import { useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Heart, Star, Clock, Users, CheckCircle2, TrendingUp, Award } from 'lucide-react';

const experiences = [
  {
    id: '1',
    title: 'Hidden Stories of the Gothic Quarter',
    host: { name: 'Maria Garcia', verified: true, avatar: 'MG' },
    image: 'https://images.unsplash.com/photo-1761666520000-def67e58766e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxraW5nJTIwdG91cnxlbnwxfHx8fDE3NjIzNjE1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Culture',
    duration: '3 hours',
    groupSize: '6-8 people',
    price: 45,
    rating: 4.9,
    reviews: 127,
    location: 'Barcelona, Spain',
    tags: ['History', 'Walking', 'Local insights'],
    featured: true,
  },
  {
    id: '2',
    title: 'Authentic Vietnamese Street Food Journey',
    host: { name: 'Linh Nguyen', verified: true, avatar: 'LN' },
    image: 'https://images.unsplash.com/photo-1760049869567-e4ae462306f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMGZvb2QlMjBleHBlcmllbmNlfGVufDF8fHx8MTc2MjM2MTU3MHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Food',
    duration: '4 hours',
    groupSize: '4-6 people',
    price: 38,
    rating: 5.0,
    reviews: 89,
    location: 'Hanoi, Vietnam',
    tags: ['Culinary', 'Street food', 'Family recipes'],
    trending: true,
  },
  {
    id: '3',
    title: 'Traditional Pottery Workshop with Local Artisan',
    host: { name: 'Yuki Tanaka', verified: true, avatar: 'YT' },
    image: 'https://images.unsplash.com/photo-1500472141701-084e6fa44840?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwd29ya3Nob3B8ZW58MXx8fHwxNzYyMzYxNTcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Arts',
    duration: '2.5 hours',
    groupSize: '3-5 people',
    price: 65,
    rating: 4.8,
    reviews: 54,
    location: 'Kyoto, Japan',
    tags: ['Hands-on', 'Traditional craft', 'Artisan'],
    trending: true,
  },
  {
    id: '4',
    title: "Storyteller's Walk Through Harlem Heritage",
    host: { name: 'Marcus Johnson', verified: true, avatar: 'MJ' },
    image: 'https://images.unsplash.com/photo-1666617181888-40d6e700ba62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0b3J5dGVsbGluZ3xlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Culture',
    duration: '2 hours',
    groupSize: '5-8 people',
    price: 40,
    rating: 4.9,
    reviews: 92,
    location: 'New York, USA',
    tags: ['History', 'Music', 'Civil rights'],
  },
  {
    id: '5',
    title: 'Dawn Market Tour & Cooking Class',
    host: { name: 'Priya Sharma', verified: true, avatar: 'PS' },
    image: 'https://images.unsplash.com/photo-1743485753975-3175a37b2e80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRoZW50aWMlMjBsb2NhbCUyMG1hcmtldHxlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Food',
    duration: '5 hours',
    groupSize: '4-6 people',
    price: 55,
    rating: 5.0,
    reviews: 108,
    location: 'Jaipur, India',
    tags: ['Early morning', 'Cooking', 'Market'],
  },
  {
    id: '6',
    title: 'Community Garden & Urban Farming Experience',
    host: { name: 'Sophie Martin', verified: true, avatar: 'SM' },
    image: 'https://images.unsplash.com/photo-1625246433906-6cfa33544b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmd8ZW58MXx8fHwxNzYyMzUwNzk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Nature',
    duration: '3 hours',
    groupSize: '6-10 people',
    price: 35,
    rating: 4.7,
    reviews: 43,
    location: 'Paris, France',
    tags: ['Sustainability', 'Hands-on', 'Community'],
  },
];

interface HomePageProps {
  onExperienceSelect?: (id: string) => void;
}

export function HomePage({ onExperienceSelect }: HomePageProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const featuredExperience = experiences.find(exp => exp.featured);
  const trendingExperiences = experiences.filter(exp => exp.trending);
  const topRatedExperiences = experiences.filter(exp => exp.rating >= 4.9);

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
    <div className="min-h-screen bg-white">
      {/* Hero Section - Featured Experience */}
      {featuredExperience && (
        <section className="relative h-[70vh] min-h-[500px] bg-gray-900">
          <div className="absolute inset-0">
            <ImageWithFallback
              src={featuredExperience.image}
              alt={featuredExperience.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-2xl text-white">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0">
                  Featured Experience
                </Badge>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                  <span>{featuredExperience.rating}</span>
                  <span className="text-white/80">({featuredExperience.reviews} reviews)</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-4">
                {featuredExperience.title}
              </h1>

              <p className="text-xl mb-6 text-white/90">
                Discover the authentic stories hidden in Barcelona's Gothic Quarter with local historian {featuredExperience.host.name}
              </p>

              <div className="flex items-center gap-6 mb-8 text-white/90">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{featuredExperience.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{featuredExperience.groupSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">${featuredExperience.price}</span>
                  <span className="text-sm">per person</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => onExperienceSelect?.(featuredExperience.id)}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
                >
                  Book This Experience
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => onExperienceSelect?.(featuredExperience.id)}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending This Week */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <h2 className="text-3xl">Trending This Week</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingExperiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                isFavorite={favorites.has(experience.id)}
                onToggleFavorite={toggleFavorite}
                onSelect={onExperienceSelect}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Experiences */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-6 w-6 text-orange-500" />
            <h2 className="text-3xl">Top Rated Experiences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRatedExperiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                isFavorite={favorites.has(experience.id)}
                onToggleFavorite={toggleFavorite}
                onSelect={onExperienceSelect}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-rose-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl mb-4">Ready to explore?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover authentic experiences curated by local hosts who are passionate about sharing their culture and stories.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = '/explore'}
            className="bg-white text-orange-600 hover:bg-gray-100"
          >
            Browse All Experiences
          </Button>
        </div>
      </section>
    </div>
  );
}

interface ExperienceCardProps {
  experience: typeof experiences[0];
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect?: (id: string) => void;
}

function ExperienceCard({ experience, isFavorite, onToggleFavorite, onSelect }: ExperienceCardProps) {
  return (
    <div className="group">
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-[4/3]">
          <ImageWithFallback
            src={experience.image}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(experience.id);
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-700'
              }`}
            />
          </button>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-white text-black hover:bg-white">
              {experience.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Location & Rating */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{experience.location}</p>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
              <span className="text-sm">{experience.rating}</span>
              <span className="text-sm text-gray-500">({experience.reviews})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg mb-3 line-clamp-2 min-h-[3.5rem]">
            {experience.title}
          </h3>

          {/* Host */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-8 w-8 bg-gradient-to-br from-orange-400 to-rose-500">
              <AvatarFallback className="text-white text-xs">
                {experience.host.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-700">{experience.host.name}</span>
              {experience.host.verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </div>

          {/* Duration & Group Size */}
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{experience.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{experience.groupSize}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {experience.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-lg">${experience.price}</span>
              <span className="text-sm text-gray-500"> per person</span>
            </div>
            <Button
              onClick={() => onSelect?.(experience.id)}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              Book now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
