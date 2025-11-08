"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExploreAPI, ExploreEventRun } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ExperiencesSection } from "@/components/landing/ExperiencesSection";
import { ExperienceCard, type ExperienceCardProps } from "@/components/landing/ExperienceCard";
import { useRouter } from "next/navigation";
// import SearchBar from "@/components/SearchBar";
// import ServerDebug from "@/components/ServerDebug";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
};

type ExperienceSectionItem = Omit<ExperienceCardProps, "onSelect">;

const formatCategoryLabel = (domain?: string | null) => {
  if (!domain) return "Culture";
  return domain
    .toString()
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const buildEventRunTags = (eventRun: ExploreEventRun) => {
  const tags: string[] = [];
  if (eventRun.experience_theme) {
    tags.push(eventRun.experience_theme);
  }
  if (eventRun.available_spots > 0 && eventRun.available_spots < 5) {
    tags.push(`${eventRun.available_spots} spots left`);
  }
  if (eventRun.neighborhood) {
    tags.push(eventRun.neighborhood);
  }
  return tags;
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
  
  const liveExperienceCards = useMemo<ExperienceSectionItem[]>(() => {
    return eventRuns.map((eventRun) => {
      const price = parseFloat(eventRun.price_inr);
      return {
        id: eventRun.id,
        title: eventRun.experience_title,
        host: {
          name: eventRun.host_name,
          verified: true,
        },
        image: eventRun.cover_photo_url ?? undefined,
        category: formatCategoryLabel(eventRun.experience_domain),
        duration: formatDuration(eventRun.duration_minutes),
        groupSize: `${eventRun.max_capacity} people`,
        price,
        priceLocale: "en-IN",
        currencySymbol: "₹",
        ratingLabel: "New",
        location: eventRun.neighborhood || "Mumbai",
        description: eventRun.experience_promise ?? undefined,
        tags: buildEventRunTags(eventRun).slice(0, 3),
        ctaHref: `/experiences/${eventRun.experience_id}/runs/${eventRun.id}`,
      };
    });
  }, [eventRuns]);

  return (
    <div className="min-h-screen bg-white">
      {/* Server Debug Info - Commented out for now */}
      {/* {process.env.NODE_ENV === 'development' && <ServerDebug />} */}
      
      {/* Header removed - now using global Navbar component */}
      
      {/* Search Bar (temporarily disabled) */}
      {/* <SearchBar /> */}
      
      {/* Curated Experiences Section - Starting directly with filters and cards */}
      <ExperiencesSection additionalExperiences={liveExperienceCards} />
      
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
  const router = useRouter();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const price = parseFloat(eventRun.price_inr);
  const navigateToRun = () => {
    router.push(`/experiences/${eventRun.experience_id}/runs/${eventRun.id}`);
  };

  return (
    <ExperienceCard
      id={eventRun.id}
      title={eventRun.experience_title}
      host={{
        name: eventRun.host_name,
        verified: true,
      }}
      image={eventRun.cover_photo_url}
      category={formatCategoryLabel(eventRun.experience_domain)}
      duration={formatDuration(eventRun.duration_minutes)}
      groupSize={`${eventRun.max_capacity} people`}
      price={price}
      priceLocale="en-IN"
      currencySymbol="₹"
      ratingLabel="New"
      location={eventRun.neighborhood || 'Mumbai'}
      description={eventRun.experience_promise ?? undefined}
      tags={buildEventRunTags(eventRun).slice(0, 3)}
      onSelect={navigateToRun}
      ctaHref={`/experiences/${eventRun.experience_id}/runs/${eventRun.id}`}
      onCtaClick={navigateToRun}
    />
  );
}