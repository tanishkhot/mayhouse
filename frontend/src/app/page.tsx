"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExploreAPI, ExploreEventRun } from "@/lib/api";
import { ExperiencesSection } from "@/components/landing/ExperiencesSection";
import { type ExperienceCardProps } from "@/components/landing/ExperienceCard";
import Link from "next/link";
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
  const { data: eventRuns = [] } = useQuery({
    queryKey: ["explore"], // Removed filter dependencies for now
    queryFn: () => ExploreAPI.getUpcomingExperiences({
      // domain: selectedDomain,
      // neighborhood: selectedNeighborhood,
      limit: 50
    }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (matches global default)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
    retry: 1, // Only retry once
    placeholderData: (previousData) => previousData, // Show previous data while refetching
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

      {/* Explore Footer Navigation */}
      <div className="border-t border-border/60 bg-gradient-to-b from-white via-white to-orange-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-semibold text-foreground">Keep exploring with <span className="font-brand">Mayhouse</span></h2>
            <p className="text-muted-foreground">
              Jump into our other spaces to browse every experience, get your hosting journey underway,
              or reach someone from our team.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest text-orange-500">Discover</span>
              <div className="flex flex-col space-y-2">
                <Link href="/explore" className="text-foreground font-medium hover:text-orange-600 transition">
                  Browse all experiences →
                </Link>
                <p>See everything that&apos;s live and ready to book.</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Link href="/explore?f=new" className="hover:text-orange-600 transition">
                  New this week
                </Link>
                <Link href="/explore?f=nearby" className="hover:text-orange-600 transition">
                  Happening nearby
                </Link>
                <Link href="/explore?f=themes" className="hover:text-orange-600 transition">
                  Themes & collections
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest text-orange-500">Host</span>
              <div className="flex flex-col space-y-2">
                <Link href="/host-dashboard" className="text-foreground font-medium hover:text-orange-600 transition">
                  Become a host →
                </Link>
                <p>Share your city with travelers and earn as you host.</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Link href="/host-dashboard?tab=resources" className="hover:text-orange-600 transition">
                  Hosting resources
                </Link>
                <Link href="/host-dashboard?tab=eventruns" className="hover:text-orange-600 transition">
                  Manage event runs
                </Link>
                <Link href="/host-dashboard?tab=community" className="hover:text-orange-600 transition">
                  Join the community
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest text-orange-500">Plan</span>
              <div className="flex flex-col space-y-2">
                <Link href="/account/bookings" className="text-foreground font-medium hover:text-orange-600 transition">
                  View your bookings →
                </Link>
                <p>Check upcoming plans and manage reservations.</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Link href="/account/wishlist" className="hover:text-orange-600 transition">
                  Saved experiences
                </Link>
                <Link href="/account/history" className="hover:text-orange-600 transition">
                  Past trips
                </Link>
                <Link href="/account/profile" className="hover:text-orange-600 transition">
                  Update profile
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest text-orange-500">Support</span>
              <div className="flex flex-col space-y-2">
                <Link href="/support" className="text-foreground font-medium hover:text-orange-600 transition">
                  Help & support →
                </Link>
                <p>Find answers or talk to us if you need a hand.</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Link href="/support/safety" className="hover:text-orange-600 transition">
                  Safety information
                </Link>
                <Link href="/support/policies" className="hover:text-orange-600 transition">
                  Policies & guidelines
                </Link>
                <Link href="/support/contact" className="hover:text-orange-600 transition">
                  Contact Mayhouse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}