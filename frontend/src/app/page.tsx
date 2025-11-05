"use client";

import { useQuery } from "@tanstack/react-query";
import { ExploreAPI, ExploreEventRun } from "@/lib/api";
import Link from "next/link";
import { Heart } from "lucide-react";
import PriceDisplay from "@/components/PriceDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import ServerDebug from "@/components/ServerDebug";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
};

export default function ExplorePage() {
  const { data: eventRuns = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["explore"], // Removed filter dependencies for now
    queryFn: () => ExploreAPI.getUpcomingExperiences({
      // domain: selectedDomain,
      // neighborhood: selectedNeighborhood,
      limit: 50
    }),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
      
      {/* Search Bar - Commented out for now */}
      {/* 
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-full shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900">Experiences nearby</h1>
                <p className="text-sm text-gray-500">Discover unique local adventures in Mumbai</p>
              </div>
              <button className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      */}
      
      {/* Filters - Commented out for now */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    <Link
      href={`/experiences/${eventRun.experience_id}/runs/${eventRun.id}`}
      className="group cursor-pointer"
    >
      <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        {/* 
          Hero Image Pattern (Airbnb-style):
          - Large hero image (h-64) for visual impact
          - Dark gradient overlay at bottom (from-black/60) ensures white text is readable
          - Text positioned absolutely at bottom-left (standard pattern)
          - Badges/icons positioned at corners for easy scanning
          This creates a modern, app-like card design that's visually engaging
        */}
        <div className="h-64 relative overflow-hidden">
          {eventRun.cover_photo_url ? (
            <>
              <img 
                src={eventRun.cover_photo_url} 
                alt={eventRun.experience_title}
                className="w-full h-full object-cover"
              />
              {/* Dark gradient overlay - ensures white text is readable on any image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </>
          ) : (
            <>
              <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-600"></div>
              <div className="absolute inset-0 bg-black/20"></div>
            </>
          )}
          {/* Title positioned at bottom-left - standard hero card pattern */}
          <div className="absolute bottom-4 left-4 text-white">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 mb-2">
              {eventRun.experience_domain}
            </Badge>
            <h3 className="font-semibold text-lg leading-tight">
              {eventRun.experience_title}
            </h3>
          </div>
          
          {/* Heart Icon */}
          <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10">
            <Heart className="w-5 h-5 text-white/80 hover:text-white" fill="none" />
          </button>
          
          {/* Available spots badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-900 border-0">
              {eventRun.available_spots} spots left
            </Badge>
          </div>
        </div>
        
        {/* Card Content */}
        <CardContent className="pt-3 space-y-1">
          {/* Promise/tagline */}
          {eventRun.experience_promise && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {eventRun.experience_promise}
            </p>
          )}
          
          {/* Date and duration */}
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <span>{formatDate(eventRun.start_datetime)}</span>
            <span>•</span>
            <span>{formatDuration(eventRun.duration_minutes)}</span>
          </div>
          
          {/* Location and host */}
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <span>{eventRun.neighborhood}</span>
            <span>•</span>
            <span>with {eventRun.host_name}</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col gap-1">
              <PriceDisplay 
                priceINR={parseFloat(eventRun.price_inr)}
                size="small"
                showINR={true}
                layout="inline"
              />
              <span className="text-gray-500 text-xs">per person</span>
            </div>
            
            {/* Rating placeholder */}
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.953a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.953c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.953a1 1 0 00-.364-1.118L2.643 9.38c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.953z" />
              </svg>
              <span>New</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}