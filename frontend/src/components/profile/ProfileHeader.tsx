"use client";

import { PublicProfile } from "@/lib/api";
import { Edit2 } from "lucide-react";

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
    <div className="relative">
      {/* Cover Image */}
      <div className="h-64 bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 relative">
        {/* Optional: Add cover image upload later */}
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16">
          {/* Profile Picture */}
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-end space-x-6">
              <div className="relative">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.full_name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {getInitials(profile.full_name)}
                  </div>
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                  {isSuperhost && (
                    <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                      Superhost
                    </span>
                  )}
                </div>
                {profile.username && (
                  <p className="text-gray-600 text-lg">@{profile.username}</p>
                )}
              </div>
            </div>

            {/* Edit Button */}
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

          {/* Stats Bar */}
          {profile.role === "host" && stats && (
            <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-gray-200">
              {stats.review_count > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">{stats.review_count}</span>
                  <span className="text-gray-600">Reviews</span>
                </div>
              )}
              {stats.avg_rating && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">{stats.avg_rating.toFixed(1)}</span>
                  <span className="text-gray-600">★ Rating</span>
                </div>
              )}
              {stats.years_hosting > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.years_hosting < 1 
                      ? "< 1" 
                      : stats.years_hosting === Math.floor(stats.years_hosting)
                      ? Math.floor(stats.years_hosting).toString()
                      : stats.years_hosting.toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    {stats.years_hosting < 1 ? "Year" : stats.years_hosting === 1 ? "Year" : "Years"} hosting
                  </span>
                </div>
              )}
              {stats.experience_count > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">{stats.experience_count}</span>
                  <span className="text-gray-600">Experiences</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

