'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ExperienceCard } from '@/components/landing/ExperienceCard';
import { mapFormToCardProps } from '@/lib/experience-preview-mapper';
import { FormState } from '@/lib/experience-mapper';
import { UserResponse } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Edit3 } from 'lucide-react';
import Icon from '../ui/icon';

interface ExperiencePreviewCardProps {
  form: FormState;
  host: UserResponse | null;
  photos: Array<{ id: string; url: string; isCover: boolean; caption?: string }>;
  onEdit?: () => void;
  onSubmit?: () => void;
}

export default function ExperiencePreviewCard({
  form,
  host,
  photos,
  onEdit,
  onSubmit,
}: ExperiencePreviewCardProps) {
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get cover photo (first photo marked as cover, or first photo, or null)
  const coverPhoto = useMemo(() => {
    const cover = photos.find(p => p.isCover);
    return cover?.url || photos[0]?.url || null;
  }, [photos]);

  // Handle mouse movement across entire page - 3D cylindrical rotation (horizontal only)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const mouseXRelative = e.clientX - cardCenterX;
      
      // Calculate rotation angle (max 7.5 degrees in each direction - 50% of original)
      const maxRotation = 7.5;
      // Use viewport width for smoother tracking across entire screen
      const viewportWidth = window.innerWidth;
      const rotation = (mouseXRelative / viewportWidth) * maxRotation * 2;
      const clampedRotation = Math.max(-maxRotation, Math.min(maxRotation, rotation));
      
      setRotateY(clampedRotation);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Map form data to card props
  const cardProps = useMemo(() => {
    return mapFormToCardProps(form, host, coverPhoto);
  }, [form, host, coverPhoto]);

  // Check if form has minimum data to show preview
  const hasMinimumData = form.title.trim().length >= 10 && form.description.trim().length >= 50;

  if (!hasMinimumData) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            Fill in the title and description to see a preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div 
        ref={cardRef}
        className="relative transition-transform duration-300 ease-out"
        style={{ 
          transform: `rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
      {/* Preview Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          Preview
        </Badge>
      </div>
      
      {/* Experience Card */}
      <ExperienceCard
        {...cardProps}
        onSelect={() => {}} // No-op for preview
        ctaLabel="Edit Experience"
        onCtaClick={onEdit || (() => {})} // Call onEdit when clicked
        ctaIcon={<Icon as={Edit3} size={16} className="text-white" />}
        ctaClassName="bg-black hover:bg-black/90 text-white"
      />
      </div>
      
      {/* Submit Button - Below the card (outside rotating container) */}
      {onSubmit && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors text-sm font-medium"
          >
            Submit Experience
          </button>
        </div>
      )}
    </div>
  );
}

