"use client";

import { useQuery } from "@tanstack/react-query";
import { EventRunAPI } from "@/lib/event-run-api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Clock, Users, Star } from "lucide-react";
import BookEventButton from "@/components/BookEventButton";
import PriceDisplay from "@/components/PriceDisplay";

export default function ExperienceRunDetailPage() {
  const params = useParams();
  const runId = params.runId as string;

  // Fetch the specific event run details (includes experience info)
  const { data: eventRun, isLoading: eventRunLoading, error: eventRunError } = useQuery({
    queryKey: ["eventRun", runId],
    queryFn: () => EventRunAPI.getPublicEventRunDetails(runId),
    enabled: !!runId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (matches global default)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Use cached data if available
    placeholderData: (previousData) => previousData, // Show previous data while refetching
  });

  // Note: We get all needed data from eventRun now, no need for separate experience fetch
  // The explore API only has mock data for exp_001 anyway
  
  const isLoading = eventRunLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (eventRunError || !eventRun) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Run not found</h1>
          <p className="text-gray-600 mb-4">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="text-terracotta-600 hover:text-terracotta-700 font-medium">
            ← Back to explore
          </Link>
        </div>
      </div>
    );
  }

  // Build display data from eventRun (includes all needed fields)
  const displayData = {
    title: eventRun.experience_title || "Experience",
    description: "Discover an amazing local experience", // Generic description
    price: eventRun.price_inr,
    duration: eventRun.duration_minutes 
      ? `${Math.floor(eventRun.duration_minutes / 60)}h ${eventRun.duration_minutes % 60}m`
      : "Duration TBA",
    host: {
      name: eventRun.host_name || "Host",
      wallet_address: eventRun.host_wallet_address,
      bio: "Experienced local host",
      rating: undefined as number | undefined,
      experience_count: undefined as number | undefined,
      languages: undefined as string[] | undefined,
    },
    upcoming_sessions: [{
      date: eventRun.start_datetime,
      available_spots: eventRun.booking_summary?.available_spots || eventRun.max_capacity,
    }],
    category: eventRun.experience_domain,
    location: {
      area: eventRun.neighborhood || "Location TBA",
    },
    max_participants: eventRun.max_capacity,
    rating: undefined as number | undefined,
    review_count: 0,
    reviews: undefined as Array<{ user: string; rating: number; date: string; comment: string }> | undefined,
    includes: undefined as string[] | undefined,
    what_to_bring: undefined as string[] | undefined,
    long_description: undefined as string | undefined,
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16">
            <nav className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Heart className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="h-96 bg-gradient-to-br from-red-400 to-pink-600 relative">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute bottom-6 left-6 text-white">
          <div className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3 w-fit">
            {displayData.category || eventRun.experience_domain}
          </div>
          <h1 className="text-4xl font-bold mb-2">{displayData.title}</h1>
          <p className="text-lg text-white/90 max-w-2xl">{displayData.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>
                  {displayData.duration || 
                   (eventRun.duration_minutes 
                     ? `${Math.floor(eventRun.duration_minutes / 60)}h ${eventRun.duration_minutes % 60}m`
                     : "Duration TBA")}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>Max {displayData.max_participants || eventRun.max_capacity} people</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{displayData.location?.area || eventRun.neighborhood || "Location TBA"}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Star className="w-5 h-5" />
                <span>{displayData.rating || "New"} {displayData.review_count ? `(${displayData.review_count} reviews)` : ""}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What you&apos;ll do</h2>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {displayData.long_description || displayData.description || "Experience details coming soon."}
                </p>
              </div>
            </div>

            {/* What&apos;s included */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What&apos;s included</h2>
              <ul className="space-y-2">
                {displayData.includes?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to bring */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What to bring</h2>
              <ul className="space-y-2">
                {displayData.what_to_bring?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Host */}
            <div className="border-t border-gray-200 pt-8">
              <Link 
                href={eventRun.host_id ? `/users/${eventRun.host_id}` : '#'}
                className="flex items-start space-x-4 hover:bg-gray-50 p-4 rounded-lg -m-4 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-terracotta-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {displayData.host?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-terracotta-600 transition-colors">
                    Meet your host, {displayData.host?.name}
                  </h3>
                  <p className="text-gray-600 mt-2">{displayData.host?.bio || "Experienced local host"}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    {displayData.host?.rating && <span>{displayData.host.rating} ★ host rating</span>}
                    {displayData.host?.experience_count && <span>{displayData.host.experience_count} experiences</span>}
                    {displayData.host?.languages && <span>Speaks {displayData.host.languages.join(", ")}</span>}
                  </div>
                  <p className="text-sm text-terracotta-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    View profile →
                  </p>
                </div>
              </Link>
            </div>

            {/* Reviews */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Reviews ({displayData.review_count || 0})
              </h2>
              <div className="space-y-6">
                {displayData.reviews?.map((review: { user: string; rating: number; date: string; comment: string }, index: number) => (
                  <div key={index} className="flex space-x-4">
                    <div className="w-10 h-10 bg-terracotta-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {review.user.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">{review.user}</span>
                        <div className="flex text-yellow-400">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-gray-500 text-sm">{review.date}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <PriceDisplay 
                  priceINR={Number(displayData.price)} 
                  size="large"
                  layout="stacked"
                  className="flex flex-col items-center"
                />
                <div className="text-gray-500 mt-2">per person</div>
              </div>

              {/* Available dates */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Choose a date</h3>
                <div className="space-y-2">
                  {displayData.upcoming_sessions?.map((session: { date: string; available_spots: number }, index: number) => (
                    <button
                      key={index}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.available_spots} spots available
                          </div>
                        </div>
                        <PriceDisplay 
                          priceINR={Number(displayData.price)} 
                          size="small"
                          showINR={true}
                          layout="inline"
                          className="text-sm"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <BookEventButton 
                eventRunId={runId}
                availableSeats={displayData.upcoming_sessions?.[0]?.available_spots || eventRun.max_capacity}
                hostWalletAddress={displayData.host?.wallet_address || eventRun.host_wallet_address || undefined}
                eventTimestamp={displayData.upcoming_sessions?.[0]?.date || eventRun.start_datetime}
                priceINR={Number(displayData.price || eventRun.price_inr)}
              />

              <p className="text-center text-sm text-gray-500 mt-3">
                Includes 20% refundable stake
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}