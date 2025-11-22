"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProfileAPI, AuthAPI, HostExperience } from "@/lib/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AboutSection } from "@/components/profile/AboutSection";
import { HostExperiencesSection } from "@/components/profile/HostExperiencesSection";
import { ReviewsSection } from "@/components/profile/ReviewsSection";
import { HostStatsCard } from "@/components/profile/HostStatsCard";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ProfilePageSkeleton } from "@/components/skeletons";
import { ExperiencePreviewModal } from "@/components/experience-preview";
import { normalizeHostExperience, convertPhotosToArray } from "@/lib/experience-preview-normalizer";
import { experienceAPI } from "@/lib/experience-api";
import { ExperiencePhoto } from "@/lib/experience-preview-types";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Preview modal state
  const [previewExperience, setPreviewExperience] = useState<HostExperience | null>(null);
  const [fullExperienceDetails, setFullExperienceDetails] = useState<any>(null);
  const [previewPhotos, setPreviewPhotos] = useState<ExperiencePhoto[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
    return <ProfilePageSkeleton />;
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
          <p className="text-gray-600 mb-4">The user you&apos;re looking for doesn&apos;t exist or has been removed.</p>
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
          {/* Left Column - Profile Card (like Airbnb) */}
          <div className="lg:col-span-1">
            {/* Profile Stats Card */}
            {profile.role === "host" && profile.host_stats && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <HostStatsCard stats={profile.host_stats} />
              </div>
            )}
          </div>

          {/* Right Column - About Section & Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <AboutSection profile={profile} />

            {/* Host Experiences Section */}
            {profile.role === "host" && experiencesData && (
              <HostExperiencesSection
                experiences={experiencesData.experiences}
                totalCount={experiencesData.count}
                hostId={userId}
                onExperiencePreview={async (exp: HostExperience) => {
                  setLoadingPreview(true);
                  setPreviewError(null);
                  try {
                    // Fetch full experience details (HostExperience is summary only)
                    const fullDetails = await experienceAPI.getExperience(exp.id);
                    
                    // Fetch photos
                    let photos: ExperiencePhoto[] = [];
                    try {
                      const photosResponse = await api.get(`/experiences/${exp.id}/photos`);
                      photos = photosResponse.data as ExperiencePhoto[];
                    } catch (err) {
                      console.warn('Could not fetch photos:', err);
                      // Use cover_photo_url from HostExperience if available
                      if (exp.cover_photo_url) {
                        photos = [{
                          id: exp.id,
                          photo_url: exp.cover_photo_url,
                          is_cover_photo: true,
                          display_order: 0
                        }];
                      }
                    }
                    
                    setFullExperienceDetails(fullDetails);
                    setPreviewPhotos(photos);
                    setPreviewExperience(exp);
                  } catch (err) {
                    setPreviewError(err instanceof Error ? err.message : 'Failed to load experience');
                    console.error('Error loading experience:', err);
                  } finally {
                    setLoadingPreview(false);
                  }
                }}
              />
            )}

            {/* Reviews Section */}
            <ReviewsSection
              reviewCount={profile.host_stats?.review_count || 0}
              avgRating={profile.host_stats?.avg_rating}
              hostId={userId}
            />
          </div>
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

      {/* Experience Preview Modal */}
      {previewExperience && fullExperienceDetails && (
        <ExperiencePreviewModal
          experience={useMemo(() => 
            normalizeHostExperience(previewExperience, fullExperienceDetails),
            [previewExperience, fullExperienceDetails]
          )}
          photos={convertPhotosToArray(previewPhotos)}
          host={profile}
          onClose={() => {
            setPreviewExperience(null);
            setFullExperienceDetails(null);
            setPreviewPhotos([]);
            setPreviewError(null);
          }}
          mode="saved"
          isLoading={loadingPreview}
          error={previewError}
        />
      )}
    </div>
  );
}

