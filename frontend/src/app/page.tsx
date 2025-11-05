"use client";

import { useQuery } from "@tanstack/react-query";
import { ExploreAPI, ExploreEventRun } from "@/lib/api";
import Link from "next/link";
import { Heart, Users, Clock, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import PriceDisplay from "@/components/PriceDisplay";
import { ExperiencesSection } from "@/components/landing/ExperiencesSection";
// import ServerDebug from "@/components/ServerDebug";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
};

export default function ExplorePage() {
  const { data: eventRuns = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["explore"], // Removed filter dependencies for now
    queryFn: () => ExploreAPI.getUpcomingExperiences({
      // domain: selectedDomain,
      // neighborhood: selectedNeighborhood,
      limit: 50
    }),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1, // Only retry once
  });
  
  // Categories and neighborhoods commented out for now
  // const { data: categoriesData } = useQuery({
  //   queryKey: ["categories"],
  //   queryFn: ExploreAPI.getCategories
  // });
  
  // const categories: Category[] = categoriesData?.categories || [];
  
  // Get unique neighborhoods from current event runs
  // const neighborhoods = [...new Set(eventRuns.map(run => run.neighborhood).filter(Boolean))] as string[];
  
  const formatPrice = (priceStr: string) => {
    const price = parseFloat(priceStr);
    return `₹${price.toLocaleString('en-IN')}`;
  };
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Server Debug Info - Commented out for now */}
      {/* {process.env.NODE_ENV === 'development' && <ServerDebug />} */}
      
      {/* Header removed - now using global Navbar component */}
      
      {/* Curated Experiences Section - Starting directly with filters and cards */}
      <ExperiencesSection />
      
      {/* Event Runs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {eventsError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error loading experiences</p>
            <p className="text-red-600 text-sm mt-1">
              {eventsError instanceof Error ? eventsError.message : 'Failed to fetch experiences'}
            </p>
            <details className="mt-2">
              <summary className="text-red-600 text-xs cursor-pointer">Show details</summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(eventsError, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        {/* 
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Category Pills */}
          {/* 
          <button
            onClick={() => setSelectedDomain(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedDomain
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedDomain(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedDomain === category.id
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
          
          {/* Neighborhood Filter */}
          {/* 
          {neighborhoods.length > 0 && (
            <select
              value={selectedNeighborhood || ""}
              onChange={(e) => setSelectedNeighborhood(e.target.value || undefined)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 border-0 text-gray-700 hover:bg-gray-200"
            >
              <option value="">All neighborhoods</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Results Count */}
        {/* 
        <div className="mb-6">
          <p className="text-gray-600">
            {eventsLoading ? "Loading..." : `${eventRuns.length} experiences`}
            {selectedDomain && ` in ${categories.find(c => c.id === selectedDomain)?.name}`}
            {selectedNeighborhood && ` in ${selectedNeighborhood}`}
          </p>
        </div>
        */}
        
        {/* Event Run Cards Grid */}
        {eventsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden !p-0">
                <Skeleton className="w-full aspect-[4/3]" />
                <div className="p-4 space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventRuns.map((eventRun) => (
              <EventRunCard key={eventRun.id} eventRun={eventRun} />
            ))}
          </div>
        )}
        
        {!eventsLoading && eventRuns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No experiences found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventRunCard({ eventRun }: { eventRun: ExploreEventRun }) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const price = parseFloat(eventRun.price_inr);
  
  return (
    <Card 
      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-shadow !p-0 !py-0 !gap-0 !shadow-none"
    >
      <Link href={`/experiences/${eventRun.experience_id}/runs/${eventRun.id}`}>
        <div className="relative">
          {eventRun.cover_photo_url ? (
            <img
              src={eventRun.cover_photo_url}
              alt={eventRun.experience_title}
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-400 to-rose-500" />
          )}
          <button 
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add to favorites
            }}
          >
            <Heart className="h-5 w-5" />
          </button>
          <Badge className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-foreground hover:bg-white">
            {eventRun.experience_domain}
          </Badge>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{eventRun.neighborhood || 'Mumbai'}</p>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                <span className="text-sm">New</span>
              </div>
            </div>
            <h3 className="line-clamp-2 mb-3 font-semibold">{eventRun.experience_title}</h3>
            
            {eventRun.experience_promise && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {eventRun.experience_promise}
              </p>
            )}
            
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm truncate">{eventRun.host_name}</p>
                  <Shield className="h-3 w-3 text-blue-500 flex-shrink-0" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(eventRun.duration_minutes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{eventRun.max_capacity} people</span>
              </div>
            </div>

            {eventRun.available_spots > 0 && eventRun.available_spots < 5 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  {eventRun.available_spots} spots left
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <PriceDisplay 
                priceINR={price}
                size="small"
                showINR={true}
                layout="inline"
              />
              <span className="text-sm text-muted-foreground"> per person</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/experiences/${eventRun.experience_id}/runs/${eventRun.id}`;
              }}
            >
              Book now
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}