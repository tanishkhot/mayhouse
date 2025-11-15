"use client";

import { Star } from "lucide-react";

interface ReviewsSectionProps {
  reviewCount: number;
  avgRating?: number | null;
  hostId: string;
}

export function ReviewsSection({ reviewCount, avgRating, hostId }: ReviewsSectionProps) {
  if (reviewCount === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h2>
        <p className="text-gray-600 mb-2">No reviews yet.</p>
        <p className="text-sm text-gray-500">Be the first to review this host!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Reviews ({reviewCount})</h2>
          {avgRating && (
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-lg font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {reviewCount > 0 && (
          <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
            Read all reviews →
          </button>
        )}
      </div>

      {/* Placeholder for reviews - will be implemented when reviews system is ready */}
      <div className="text-center py-8 text-gray-500">
        <p>Reviews will be displayed here once the reviews system is implemented.</p>
      </div>
    </div>
  );
}

