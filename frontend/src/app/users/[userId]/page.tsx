"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProfileAPI, AuthAPI } from "@/lib/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AboutSection } from "@/components/profile/AboutSection";
import { HostExperiencesSection } from "@/components/profile/HostExperiencesSection";
import { ReviewsSection } from "@/components/profile/ReviewsSection";
import { HostStatsCard } from "@/components/profile/HostStatsCard";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { useState } from "react";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get current user to check if viewing own profile
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: AuthAPI.me,
    retry: false,
  });

  const isOwnProfile = currentUser?.id === userId;

  // Fetch profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => ProfileAPI.getPublicProfile(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Fetch host experiences (only if host)
  const { data: experiencesData } = useQuery({
    queryKey: ["host-experiences", userId],
    queryFn: () => ProfileAPI.getHostExperiences(userId, { limit: 12 }),
    enabled: !!userId && profile?.role === "host",
    staleTime: 2 * 60 * 1000,
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200"></div>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <AboutSection profile={profile} />

            {/* Host Experiences Section */}
            {profile.role === "host" && experiencesData && (
              <HostExperiencesSection
                experiences={experiencesData.experiences}
                totalCount={experiencesData.count}
                hostId={userId}
              />
            )}

            {/* Reviews Section */}
            <ReviewsSection
              reviewCount={profile.host_stats?.review_count || 0}
              avgRating={profile.host_stats?.avg_rating}
              hostId={userId}
            />
          </div>

          {/* Right Column - Stats Card */}
          {profile.role === "host" && profile.host_stats && (
            <div className="lg:col-span-1">
              <HostStatsCard stats={profile.host_stats} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isOwnProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
        />
      )}
    </div>
  );
}

