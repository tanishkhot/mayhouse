'use client';

import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NormalizedExperienceData, PhotoArray } from '@/lib/experience-preview-types';
import type { PublicProfile, UserResponse } from '@/lib/api';
import { ExperienceStatus } from '@/lib/experience-api';
import ExperiencePreviewContent from './ExperiencePreviewContent';

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC key handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Focus first focusable element when modal opens
  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, []);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-hidden p-0 sm:max-w-6xl"
        showCloseButton={true}
        onEscapeKeyDown={onClose}
        onPointerDownOutside={onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 p-8">
              <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
              <div className="text-gray-600 text-center">{error}</div>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              <ExperiencePreviewContent
                experience={experience}
                photos={photos}
                host={host}
                mode={mode}
                showStatus={showStatus}
                status={status}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

