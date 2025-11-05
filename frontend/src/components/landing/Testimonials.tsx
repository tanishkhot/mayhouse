'use client';

import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Sarah Chen',
    location: 'San Francisco, USA',
    experience: 'Hidden Stories of the Gothic Quarter',
    rating: 5,
    text: 'This wasn\'t just a tour—it was like spending an afternoon with a friend who happens to know every secret corner of Barcelona. Maria\'s storytelling brought the city to life in a way no guidebook ever could.',
    avatar: '1',
  },
  {
    name: 'James Williams',
    location: 'London, UK',
    experience: 'Authentic Vietnamese Street Food Journey',
    rating: 5,
    text: 'The most memorable part of my entire trip to Vietnam. Linh didn\'t just show us where locals eat—she welcomed us into her family\'s food traditions. I left with new friends and recipes I\'ll treasure forever.',
    avatar: '2',
  },
  {
    name: 'Emma Schmidt',
    location: 'Berlin, Germany',
    experience: 'Traditional Pottery Workshop',
    rating: 5,
    text: 'As someone who usually avoids \'tourist activities,\' this was exactly what I was looking for. Intimate, authentic, and deeply personal. Yuki\'s workshop felt like being invited into an artisan\'s private studio.',
    avatar: '3',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-4">
            Stories from our community
          </h2>
          <p className="text-lg text-muted-foreground">
            Real experiences from travelers who chose connection over checklists.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6 space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-orange-400 text-orange-400"
                  />
                ))}
              </div>

              <p className="text-muted-foreground">
                &quot;{testimonial.text}&quot;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0 text-white">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p>{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-2">
                Attended: {testimonial.experience}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

