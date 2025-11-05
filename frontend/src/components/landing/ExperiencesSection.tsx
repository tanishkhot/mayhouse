'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperienceCard } from './ExperienceCard';
import Link from 'next/link';

const experiences = [
  {
    id: '1',
    title: 'Hidden Stories of the Gothic Quarter',
    host: {
      name: 'Maria Garcia',
      verified: true,
    },
    image: 'https://images.unsplash.com/photo-1761666520000-def67e58766e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxraW5nJTIwdG91cnxlbnwxfHx8fDE3NjIzNjE1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Culture',
    duration: '3 hours',
    groupSize: '6-8 people',
    price: 45,
    rating: 4.9,
    reviews: 127,
    location: 'Barcelona, Spain',
    tags: ['History', 'Walking', 'Local insights'],
  },
  {
    id: '2',
    title: 'Authentic Vietnamese Street Food Journey',
    host: {
      name: 'Linh Nguyen',
      verified: true,
    },
    image: 'https://images.unsplash.com/photo-1760049869567-e4ae462306f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMGZvb2QlMjBleHBlcmllbmNlfGVufDF8fHx8MTc2MjM2MTU3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Food',
    duration: '4 hours',
    groupSize: '4-6 people',
    price: 38,
    rating: 5.0,
    reviews: 89,
    location: 'Hanoi, Vietnam',
    tags: ['Culinary', 'Street food', 'Family recipes'],
  },
  {
    id: '3',
    title: 'Traditional Pottery Workshop with Local Artisan',
    host: {
      name: 'Yuki Tanaka',
      verified: true,
    },
    image: 'https://images.unsplash.com/photo-1500472141701-084e6fa44840?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwd29ya3Nob3B8ZW58MXx8fHwxNzYyMzYxNTcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Arts',
    duration: '2.5 hours',
    groupSize: '3-5 people',
    price: 65,
    rating: 4.8,
    reviews: 54,
    location: 'Kyoto, Japan',
    tags: ['Hands-on', 'Traditional craft', 'Artisan'],
  },
  {
    id: '4',
    title: "Storyteller's Walk Through Harlem Heritage",
    host: {
      name: 'Marcus Johnson',
      verified: true,
    },
    image: 'https://images.unsplash.com/photo-1666617181888-40d6e700ba62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0b3J5dGVsbGluZ3xlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    host: {
      name: 'Priya Sharma',
      verified: true,
    },
    image: 'https://images.unsplash.com/photo-1743485753975-3175a37b2e80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRoZW50aWMlMjBsb2NhbCUyMG1hcmtldHxlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    host: {
      name: 'Sophie Martin',
      verified: true,
    },
    image: 'https://images.unsplash.com/photo-1625246433906-6cfa33544b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmd8ZW58MXx8fHwxNzYyMzUwNzk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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

const categories = ['All', 'Culture', 'Food', 'Arts', 'Nature'];

interface ExperiencesSectionProps {
  onExperienceSelect?: (id: string) => void;
}

export function ExperiencesSection({ onExperienceSelect }: ExperiencesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExperiences = experiences.filter(
    (exp) => selectedCategory === 'All' || exp.category === selectedCategory
  );

  return (
    <section id="experiences" className="pt-6 pb-20 lg:pt-8 lg:pb-32 bg-gradient-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredExperiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              {...experience}
              onSelect={onExperienceSelect}
            />
          ))}
        </div>

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
