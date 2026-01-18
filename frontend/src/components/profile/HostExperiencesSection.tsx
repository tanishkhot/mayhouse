"use client";

import { HostExperience } from "@/lib/api";
import { MapPin } from "lucide-react";
import Link from "next/link";

interface HostExperiencesSectionProps {
  experiences: HostExperience[];
  totalCount: number;
  hostId: string;
  onExperiencePreview?: (experience: HostExperience) => void;
}

export function HostExperiencesSection({
  experiences,
  totalCount,
  hostId,
  onExperiencePreview,
}: HostExperiencesSectionProps) {
  const formatDomain = (domain: string) => {
    return domain
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (experiences.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Experiences</h2>
        <p className="text-gray-600">No experiences yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Experiences</h2>
        {totalCount > experiences.length && (
          <Link
            href={`/explore?host=${hostId}`}
            className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
          >
            View all {totalCount} experiences →
          </Link>
        )}
      </div>

      {/* Horizontal Scrollable Grid */}
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex space-x-4 min-w-max">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              onClick={() => onExperiencePreview?.(exp)}
              className="flex-shrink-0 w-80 group cursor-pointer"
            >
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                <div className="relative h-48 bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exp.cover_photo_url || '/experience-placeholder.png'}
                    alt={exp.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Domain Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded">
                      {formatDomain(exp.domain)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
                    {exp.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    {exp.neighborhood && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{exp.neighborhood}</span>
                      </div>
                    )}
                    <div className="font-semibold text-gray-900">
                      ₹{exp.price_inr.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

