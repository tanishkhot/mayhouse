import { useState } from 'react';
import { X, Star, Clock, Users, MapPin, Calendar as CalendarIcon, Shield, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Calendar } from './ui/calendar';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ExperienceDetailProps {
  onClose: () => void;
}

export function ExperienceDetail({ onClose }: ExperienceDetailProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    'https://images.unsplash.com/photo-1761666520000-def67e58766e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxraW5nJTIwdG91cnxlbnwxfHx8fDE3NjIzNjE1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1666617181888-40d6e700ba62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0b3J5dGVsbGluZ3xlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1568492650629-3dfa9b007cbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBodW1hbiUyMGNvbm5lY3Rpb258ZW58MXx8fHwxNzYyMzYxNTcyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="relative rounded-3xl overflow-hidden mb-8 group">
          <ImageWithFallback
            src={images[currentImageIndex]}
            alt="Experience"
            className="w-full aspect-[21/9] object-cover"
          />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Badge className="mb-3">Culture</Badge>
                  <h1 className="text-3xl sm:text-4xl mb-2">
                    Hidden Stories of the Gothic Quarter
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                      <span>4.9</span>
                      <span>(127 reviews)</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-5 w-5" />
                      <span>Barcelona, Spain</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host */}
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3>Maria Garcia</h3>
                      <Shield className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Local historian and storyteller · Host since 2022
                    </p>
                    <p className="text-sm">
                      I've lived in Barcelona's Gothic Quarter for 25 years. Every stone here has a story, 
                      and I love sharing the hidden narratives that tourists never hear.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">What you'll experience</h3>
                <p className="text-muted-foreground mb-4">
                  Forget the typical tourist trails. This intimate walk takes you through the labyrinthine 
                  streets of Barcelona's oldest neighborhood, revealing layers of Roman, Medieval, and 
                  modern history that most visitors never discover.
                </p>
                <p className="text-muted-foreground">
                  We'll visit hidden courtyards, ancient Roman walls embedded in Gothic buildings, 
                  and the favorite haunts of local artists and writers. Along the way, I'll share 
                  stories passed down through generations of my family who've called this neighborhood home.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">What's included</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-muted-foreground">
                      3-hour guided walk through hidden corners
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-muted-foreground">
                      Traditional Catalan snack at a local café
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-muted-foreground">
                      Digital guide with recommended spots
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-muted-foreground">
                      Proof-of-attendance blockchain token
                    </span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p>3 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Group size</p>
                    <p>6-8 people</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Safety</p>
                    <p>Verified host</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3>Reviews</h3>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                  <span>4.9 · 127 reviews</span>
                </div>
              </div>

              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4>Sarah Chen</h4>
                          <span className="text-sm text-muted-foreground">2 weeks ago</span>
                        </div>
                        <div className="flex gap-1 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                          ))}
                        </div>
                        <p className="text-muted-foreground">
                          This wasn't just a tour—it was like spending an afternoon with a friend 
                          who happens to know every secret corner of Barcelona. Absolutely unforgettable!
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 space-y-6">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl">$45</span>
                  <span className="text-muted-foreground">per person</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Price includes all fees
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="mb-3">Select a date</h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>

              <div>
                <h4 className="mb-3">Available times</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['10:00 AM', '2:00 PM', '4:00 PM'].map((time) => (
                    <Button key={time} variant="outline" className="w-full">
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Reserve your spot
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your payment is held in secure escrow until the experience is complete
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Full refund up to 24h before</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Host verified & background checked</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
