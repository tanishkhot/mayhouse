'use client';

import React from 'react';
import { Lightbulb, CheckCircle2, Star, ChevronLeft } from 'lucide-react';
import Icon from '../ui/icon';

interface GuidedQAIntroProps {
  onStart: () => void;
  onCancel: () => void;
}

export default function GuidedQAIntro({ onStart, onCancel }: GuidedQAIntroProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border shadow-sm p-8">
      {/* Back Button */}
      <button
        onClick={onCancel}
        className="text-sm text-black/70 mb-6 hover:underline"
      >
        <span className="inline-flex items-center gap-1">
          <Icon as={ChevronLeft} size={16} className="text-black/70" />
          Back
        </span>
      </button>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-black mb-3">
        Let us Build Together
      </h1>

      {/* Description */}
      <p className="text-black/70 mb-8">
        We&apos;ll guide you through a series of questions to create your perfect experience listing.
      </p>

      {/* What to Expect Card */}
      <div className="rounded-lg border bg-gray-50 p-6 mb-4">
        <div className="mb-4 inline-flex items-center gap-2">
          <div className="inline-flex size-6 items-center justify-center rounded-full bg-terracotta-100">
            <Icon as={Lightbulb} size={16} className="text-terracotta-600" />
          </div>
          <strong className="text-black">What to expect</strong>
        </div>
        <ul className="space-y-3 text-sm text-black/80">
          <li className="flex items-start gap-3">
            <Icon as={CheckCircle2} size={16} className="text-gray-600 shrink-0 mt-0.5" />
            <span>
              <strong>8 guided questions</strong> covering your experience details, story, logistics, and safety
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Icon as={CheckCircle2} size={16} className="text-gray-600 shrink-0 mt-0.5" />
            <span>
              <strong>AI-powered extraction</strong> of key details from your natural language answers
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Icon as={CheckCircle2} size={16} className="text-gray-600 shrink-0 mt-0.5" />
            <span>
              <strong>Preview your listing</strong> before publishing to see how travelers will see it
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Icon as={CheckCircle2} size={16} className="text-gray-600 shrink-0 mt-0.5" />
            <span>
              Takes <strong>~10-15 minutes</strong> to complete with thoughtful answers
            </span>
          </li>
        </ul>
      </div>

      {/* Tip Card */}
      <div className="rounded-lg border bg-gray-50 p-6 mb-8">
        <div className="mb-2 inline-flex items-center gap-2">
          <div className="inline-flex size-6 items-center justify-center rounded-full bg-terracotta-100">
            <Icon as={Lightbulb} size={16} className="text-terracotta-600" />
          </div>
          <strong className="text-black">Tip:</strong>
        </div>
        <p className="text-sm text-black/80">
          Be descriptive and authentic. The more detail you provide, the better your listing will be. Share your story, your passion, and what makes your experience unique.
        </p>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full bg-black text-white rounded-lg py-3 px-6 font-medium hover:bg-black/90 inline-flex items-center justify-center gap-2 transition-colors"
      >
        <Icon as={Star} size={16} className="text-white" />
        Start Guided Questions
      </button>
    </div>
  );
}

