"use client";

import { useQuery } from "@tanstack/react-query";
import { ExploreAPI, ExploreEventRun, AuthAPI, getAccessToken } from "@/lib/api";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
// import ServerDebug from "@/components/ServerDebug";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
};

export default function ExplorePage() {
  // Authentication state for personalized greeting
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Check authentication status and get user data
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const user = await AuthAPI.me();
          setIsAuthenticated(true);
          setUsername(user.username || user.email || 'User');
        } catch (error) {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } else {
        setIsAuthenticated(false);
        setUsername(null);
      }
      setLoadingUser(false);
    };

    checkAuthStatus();
  }, []);
  
  const { data: eventRuns = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["explore"], // Removed filter dependencies for now
    queryFn: () => ExploreAPI.getUpcomingExperiences({
      // domain: selectedDomain,
      // neighborhood: selectedNeighborhood,
      limit: 50
    })
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
      
      {/* Personalized Greeting for Logged-in Users */}
      {!loadingUser && isAuthenticated && username && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hi {username}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Discover amazing local experiences in Mumbai
              </p>
            </div>
          </div>
        </div>
      )}
      
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
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      <div className="relative mb-3">
        {/* Placeholder image with gradient */}
        <div className="h-64 rounded-xl bg-gradient-to-br from-red-400 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full mb-2 w-fit">
              {eventRun.experience_domain}
            </div>
            <h3 className="font-semibold text-lg leading-tight">
              {eventRun.experience_title}
            </h3>
          </div>
          
          {/* Heart Icon */}
          <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 text-white/80 hover:text-white" fill="none" />
          </button>
          
          {/* Available spots badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 text-gray-900 text-xs font-medium px-2 py-1 rounded-full">
              {eventRun.available_spots} spots left
            </span>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="mt-3 space-y-1">
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
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="font-semibold text-gray-900">
                {formatPrice(eventRun.price_inr)}
              </span>
              <span className="text-gray-500 text-sm ml-1">per person</span>
            </div>
            
            {/* Rating placeholder */}
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.953a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.953c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.953a1 1 0 00-.364-1.118L2.643 9.38c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.953z" />
              </svg>
              <span>New</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}