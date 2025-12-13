/**
 * Shared type definitions for experience preview system
 */

/**
 * Experience photo from backend API
 */
export interface ExperiencePhoto {
  id: string;
  photo_url: string;
  is_cover_photo: boolean;
  display_order: number;
  caption?: string;
}

/**
 * Photo array format for modal component
 */
export type PhotoArray = Array<{
  id: string;
  url: string;
  isCover: boolean;
  caption?: string;
}>;

/**
 * Normalized experience data for preview display
 * This is the unified format that all data sources convert to
 */
export interface NormalizedExperienceData {
  id?: string;
  title: string;
  description: string;
  promise?: string;
  uniqueElement?: string;
  hostStory?: string;
  domain: string;
  theme?: string;
  neighborhood: string;
  meetingPoint?: string;
  meetingPointDetails?: string;
  latitude?: number;
  longitude?: number;
  duration: number; // in minutes
  minCapacity?: number;
  maxCapacity?: number;
  price: number; // in INR
  inclusions?: string[];
  whatToBring?: string[];
  whatToKnow?: string;
  accessibilityNotes?: string[];
  weatherContingency?: string;
  safetyGuidelines?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';
  adminFeedback?: string;
  moderatorFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
}

