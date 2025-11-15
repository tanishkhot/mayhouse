"use client";

import { PublicProfile } from "@/lib/api";
import { Briefcase, Globe, Languages, CheckCircle, Wallet, Copy, Check } from "lucide-react";
import { useState } from "react";

interface AboutSectionProps {
  profile: PublicProfile;
}

export function AboutSection({ profile }: AboutSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyWalletAddress = () => {
    if (profile.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">About {profile.full_name}</h2>

      {/* Bio */}
      {profile.bio && (
        <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">{profile.bio}</p>
      )}

      {/* Details List */}
      <div className="space-y-4">
        {/* Work/Background */}
        {profile.host_application?.hosting_experience && (
          <div className="flex items-start space-x-3">
            <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">My work</p>
              <p className="text-sm text-gray-600">{profile.host_application.hosting_experience}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {profile.host_stats && (
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Lives in</p>
              <p className="text-sm text-gray-600">Mumbai, India</p>
            </div>
          </div>
        )}

        {/* Languages */}
        {profile.host_application?.languages_spoken && profile.host_application.languages_spoken.length > 0 && (
          <div className="flex items-start space-x-3">
            <Languages className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Speaks</p>
              <p className="text-sm text-gray-600">
                {profile.host_application.languages_spoken.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Identity Verified */}
        {profile.wallet_address && (
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Identity verified</p>
              <p className="text-sm text-gray-600">Wallet address verified</p>
            </div>
          </div>
        )}

        {/* Wallet Address */}
        {profile.wallet_address && (
          <div className="flex items-start space-x-3">
            <Wallet className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">Wallet Address</p>
              <div className="flex items-center space-x-2">
                <code className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                  {formatWalletAddress(profile.wallet_address)}
                </code>
                <button
                  onClick={copyWalletAddress}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy wallet address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Why Host (from application) */}
        {profile.host_application?.why_host && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {profile.host_application.why_host}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

