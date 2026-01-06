'use client';

import React, { useEffect, useRef } from 'react';
import { X, Heart, Share2 } from 'lucide-react';
import { NormalizedExperienceData, PhotoArray } from '@/lib/experience-preview-types';
import type { PublicProfile, UserResponse } from '@/lib/api';
import type { ExperienceStatus } from '@/lib/experience-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExperiencePreviewDetail from './ExperiencePreviewDetail';

type PreviewHost = UserResponse | PublicProfile;

interface ExperiencePreviewModalProps {
  experience: NormalizedExperienceData;
  photos?: PhotoArray;
  host?: PreviewHost | null;
  onClose: () => void;
  mode?: 'preview' | 'saved';
  showStatus?: boolean;
  status?: ExperienceStatus;
  isLoading?: boolean;
  error?: string | null;
}

export default function ExperiencePreviewModal({
  experience,
  photos = [],
  host,
  onClose,
  mode = 'preview',
  showStatus = false,
  status,
  isLoading = false,
  error,
}: ExperiencePreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    lastActiveElementRef.current =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

    const prevOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    // Focus close button (accessibility)
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prevOverflow;
      }
      lastActiveElementRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Backdrop click-to-close region (subtle) */}
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-background/20"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              className="gap-2 transition-all duration-300 hover:bg-accent active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="text-sm">Close</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="transition-all duration-300 hover:bg-accent active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Share"
                onClick={() => {}}
              >
                <Share2 className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="transition-all duration-300 hover:bg-accent active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Favorite"
                onClick={() => {}}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground" />
            </div>
          ) : error ? (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
              <Card className="max-w-md w-full py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">Error</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <div className="mt-5">
                    <Button
                      type="button"
                      variant="outline"
                      className="transition-all duration-300 active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <ExperiencePreviewDetail
              experience={experience}
              photos={photos}
              host={host}
              mode={mode}
              showStatus={showStatus}
              status={status}
              showBookingPreview={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}

