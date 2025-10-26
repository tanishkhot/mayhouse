"use client";

import { useQuery } from "@tanstack/react-query";
import { ExploreAPI } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Clock, Users, Calendar, Star } from "lucide-react";
import BookEventButton from "@/components/BookEventButton";
import PriceDisplay from "@/components/PriceDisplay";

export default function ExperienceRunDetailPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const runId = params.runId as string;

  // For now, fetch experience details (the backend has mock data for exp_001)
  const { data: experience, isLoading } = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: () => ExploreAPI.getExperienceDetails("exp_001"), // Using mock ID
  });

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

  if (!experience) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Experience not found</h1>
          <p className="text-gray-600 mb-4">The experience you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div></div>
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
            {experience.category}
          </div>
          <h1 className="text-4xl font-bold mb-2">{experience.title}</h1>
          <p className="text-lg text-white/90 max-w-2xl">{experience.description}</p>
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
                <span>{experience.duration}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>Max {experience.max_participants} people</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{experience.location?.area}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Star className="w-5 h-5" />
                <span>{experience.rating} ({experience.review_count} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What you&apos;ll do</h2>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {experience.long_description}
                </p>
              </div>
            </div>

            {/* What&apos;s included */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What&apos;s included</h2>
              <ul className="space-y-2">
                {experience.includes?.map((item: string, index: number) => (
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
                {experience.what_to_bring?.map((item: string, index: number) => (
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
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {experience.host?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Meet your host, {experience.host?.name}</h3>
                  <p className="text-gray-600 mt-2">{experience.host?.bio}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    <span>{experience.host?.rating} ★ host rating</span>
                    <span>{experience.host?.experience_count} experiences</span>
                    <span>Speaks {experience.host?.languages?.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Reviews ({experience.review_count})
              </h2>
              <div className="space-y-6">
                {experience.reviews?.map((review: { user: string; rating: number; date: string; comment: string }, index: number) => (
                  <div key={index} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                  priceINR={experience.price} 
                  size="large"
                  className="text-center"
                />
                <div className="text-gray-500 mt-2">per person</div>
              </div>

              {/* Available dates */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Choose a date</h3>
                <div className="space-y-2">
                  {experience.upcoming_sessions?.map((session: { date: string; available_spots: number }, index: number) => (
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
                          priceINR={experience.price} 
                          size="small"
                          showINR={false}
                          className="text-red-500"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <BookEventButton 
                eventRunId={runId} 
                availableSeats={experience.upcoming_sessions?.[0]?.available_spots || 0}
              />

              <p className="text-center text-sm text-gray-500 mt-3">
                💎 Includes 20% refundable stake
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}