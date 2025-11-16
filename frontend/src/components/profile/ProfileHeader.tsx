"use client";

import { PublicProfile } from "@/lib/api";
import { Edit2, CheckCircle } from "lucide-react";

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export function ProfileHeader({ profile, isOwnProfile, onEditClick }: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = profile.host_stats;
  const isSuperhost = stats && stats.experience_count >= 5 && stats.review_count >= 10 && (stats.avg_rating || 0) >= 4.8;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between">
          {/* Left: Profile Picture & Info */}
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              {profile.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_image_url}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-terracotta-500 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(profile.full_name)}
                </div>
              )}
              {/* Verified Badge */}
              {profile.wallet_address && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Name & Stats */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                {isSuperhost && (
                  <span className="px-2 py-1 bg-terracotta-500 text-white text-xs font-semibold rounded">
                    Superhost
                  </span>
                )}
              </div>
              
              {/* Stats Row */}
              {profile.role === "host" && stats && (
                <div className="flex items-center space-x-6 text-gray-600">
                  {stats.review_count > 0 && (
                    <span className="text-base">{stats.review_count} Reviews</span>
                  )}
                  {stats.avg_rating && (
                    <span className="text-base">{stats.avg_rating.toFixed(1)}★ Rating</span>
                  )}
                  {stats.years_hosting > 0 && (
                    <span className="text-base">
                      {stats.years_hosting < 1 
                        ? "< 1 Year" 
                        : stats.years_hosting === 1 
                        ? "1 Year" 
                        : `${Math.floor(stats.years_hosting)} Years`} hosting
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Edit Button */}
          {isOwnProfile && (
            <button
              onClick={onEditClick}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

