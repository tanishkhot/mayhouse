'use client';

import React from 'react';
import { Clock, Users, MapPin, Star } from 'lucide-react';
import { NormalizedExperienceData, PhotoArray } from '@/lib/experience-preview-types';
import { UserResponse } from '@/lib/api';
import { ExperienceStatus } from '@/lib/experience-api';
import { formatDuration, formatPrice, getCategoryDisplayName } from '@/lib/experience-preview-normalizer';

interface ExperiencePreviewContentProps {
  experience: NormalizedExperienceData;
  photos?: PhotoArray;
  host?: UserResponse | null;
  mode?: 'preview' | 'saved';
  showStatus?: boolean;
  status?: ExperienceStatus;
}

export default function ExperiencePreviewContent({
  experience,
  photos = [],
  host,
  mode = 'preview',
  showStatus = false,
  status,
}: ExperiencePreviewContentProps) {
  // Get cover photo or first photo, or use placeholder
  const coverPhoto = photos.find((p) => p.isCover) || photos[0];
  const coverPhotoUrl = coverPhoto?.url;

  // Get status badge color
  const getStatusColor = (status?: ExperienceStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status?: ExperienceStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'archived':
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div
        className="h-96 bg-gradient-to-br from-red-400 to-pink-600 relative"
        style={
          coverPhotoUrl
            ? {
                backgroundImage: `url(${coverPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          {showStatus && status && (
            <div className="mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
              >
                {getStatusLabel(status)}
              </span>
            </div>
          )}
          <div className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3 w-fit">
            {getCategoryDisplayName(experience.domain)}
          </div>
          <h1 className="text-4xl font-bold mb-2">{experience.title}</h1>
          <p className="text-lg text-white/90 max-w-2xl line-clamp-2">
            {experience.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(experience.duration)}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>
                  {experience.maxCapacity
                    ? `Max ${experience.maxCapacity} people`
                    : experience.minCapacity
                      ? `Min ${experience.minCapacity} people`
                      : 'Capacity TBA'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{experience.neighborhood || 'Location TBA'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Star className="w-5 h-5" />
                <span>{formatPrice(experience.price)}</span>
              </div>
            </div>

            {/* What you'll do */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What you&apos;ll do</h2>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {experience.description || 'Experience details coming soon.'}
                </p>
                {experience.promise && (
                  <p className="mt-4 text-gray-600 italic">&quot;{experience.promise}&quot;</p>
                )}
                {experience.uniqueElement && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">What makes this unique</h3>
                    <p className="text-gray-700">{experience.uniqueElement}</p>
                  </div>
                )}
              </div>
            </div>

            {/* What's included */}
            {(experience.inclusions && experience.inclusions.length > 0) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What&apos;s included</h2>
                <ul className="space-y-2">
                  {experience.inclusions.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What to bring */}
            {(experience.whatToBring && experience.whatToBring.length > 0) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What to bring</h2>
                <ul className="space-y-2">
                  {experience.whatToBring.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Good to know */}
            {experience.whatToKnow && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Good to know</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {experience.whatToKnow}
                  </p>
                </div>
              </div>
            )}

            {/* Safety Guidelines */}
            {experience.safetyGuidelines && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Safety Guidelines</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {experience.safetyGuidelines}
                  </p>
                </div>
              </div>
            )}

            {/* Host Information */}
            <div className="border-t border-gray-200 pt-8">
              {host ? (
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-terracotta-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {host.name?.charAt(0) || 'H'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Meet your host, {host.name || 'Host'}
                    </h3>
                    {host.bio && <p className="text-gray-600 mt-2">{host.bio}</p>}
                    {host.languages && host.languages.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Speaks {host.languages.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">Host information unavailable</div>
              )}
            </div>

            {/* Admin/Moderator Feedback (only in saved mode) */}
            {mode === 'saved' && (experience.adminFeedback || experience.moderatorFeedback) && (
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback</h2>
                {experience.moderatorFeedback && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Moderator Feedback</h3>
                    <p className="text-gray-700">{experience.moderatorFeedback}</p>
                  </div>
                )}
                {experience.adminFeedback && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Admin Feedback</h3>
                    <p className="text-gray-700">{experience.adminFeedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Price Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(experience.price)}
                </div>
                <div className="text-sm text-gray-600">per person</div>
              </div>

              {/* Meeting Point */}
              {experience.meetingPoint && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Meeting Point</h3>
                  <p className="text-gray-700 text-sm">{experience.meetingPoint}</p>
                  {experience.meetingPointDetails && (
                    <p className="text-gray-600 text-sm mt-2">{experience.meetingPointDetails}</p>
                  )}
                </div>
              )}

              {/* Additional Info */}
              <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
                  <p className="text-gray-700">{formatDuration(experience.duration)}</p>
                </div>
                {experience.maxCapacity && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Capacity</h3>
                    <p className="text-gray-700">
                      {experience.minCapacity
                        ? `${experience.minCapacity} - ${experience.maxCapacity} people`
                        : `Up to ${experience.maxCapacity} people`}
                    </p>
                  </div>
                )}
                {experience.neighborhood && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                    <p className="text-gray-700">{experience.neighborhood}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

