"use client";

import { HostStats } from "@/lib/api";
import { Users, Calendar, Star, TrendingUp } from "lucide-react";

interface HostStatsCardProps {
  stats: HostStats;
}

export function HostStatsCard({ stats }: HostStatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Host Statistics</h3>

      <div className="space-y-6">
        {/* Total Experiences */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.experience_count}</p>
            <p className="text-sm text-gray-600">Total Experiences</p>
          </div>
        </div>

        {/* Travelers Hosted */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-rose-100 rounded-lg">
            <Users className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.travelers_hosted}</p>
            <p className="text-sm text-gray-600">Travelers Hosted</p>
          </div>
        </div>

        {/* Average Rating */}
        {stats.avg_rating && (
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600 fill-current" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avg_rating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-xs text-gray-500 mt-1">from {stats.review_count} reviews</p>
            </div>
          </div>
        )}

        {/* Event Runs */}
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.event_run_count}</p>
            <p className="text-sm text-gray-600">Event Runs</p>
          </div>
        </div>

        {/* Years Hosting */}
        {stats.years_hosting > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hosting for{" "}
              <span className="font-semibold text-gray-900">
                {stats.years_hosting < 1
                  ? "less than a year"
                  : stats.years_hosting === 1
                  ? "1 year"
                  : `${Math.floor(stats.years_hosting)} years`}
              </span>
            </p>
          </div>
        )}

        {/* Response Rate */}
        {stats.response_rate !== null && stats.response_rate !== undefined && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Response rate: <span className="font-semibold text-gray-900">{stats.response_rate}%</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

