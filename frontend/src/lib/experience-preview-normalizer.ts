/**
 * Data normalization layer for experience preview
 * Converts different data formats to unified NormalizedExperienceData
 */

import { NormalizedExperienceData, PhotoArray, ExperiencePhoto } from './experience-preview-types';
import { ExperienceResponse } from './experience-api';
import { HostExperience } from './api';

/**
 * Form state type from DesignExperienceV2
 */
type FormState = {
  title: string;
  description: string;
  domain: string;
  theme: string;
  duration: number;
  maxCapacity: number;
  price: string;
  neighborhood: string;
  meetingPoint: string;
  latitude?: number;
  longitude?: number;
  requirements: string;
  whatToExpect: string;
  whatToKnow: string;
  whatToBring: string;
};

/**
 * ModeratorExperience type from moderator dashboard
 */
type ModeratorExperience = {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  experience_domain: string;
  duration_minutes: number;
  price_inr: number;
  traveler_max_capacity: number;
  promise: string;
  description: string;
  unique_element: string;
  neighborhood: string;
  meeting_landmark: string;
  meeting_point_details: string;
  inclusions: string[];
  traveler_should_bring: string[];
  experience_safety_guidelines: string;
  moderator_feedback?: string;
  admin_feedback?: string;
  route_data?: any;
};

/**
 * Normalize form state from design flow
 */
export function normalizeFormState(
  form: FormState,
  photos: PhotoArray
): NormalizedExperienceData {
  // Parse price string to number
  const price = parseFloat(form.price) || 0;

  // Parse whatToBring from string (comma-separated or newline-separated)
  const whatToBring = form.whatToBring
    ? form.whatToBring
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  // Parse requirements from string
  const inclusions = form.requirements
    ? form.requirements
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  return {
    title: form.title || 'Untitled Experience',
    description: form.description || 'No description provided.',
    promise: form.whatToExpect || undefined,
    uniqueElement: form.whatToExpect || undefined,
    domain: form.domain || '',
    theme: form.theme || undefined,
    neighborhood: form.neighborhood || '',
    meetingPoint: form.meetingPoint || undefined,
    latitude: form.latitude,
    longitude: form.longitude,
    duration: form.duration || 180,
    maxCapacity: form.maxCapacity || 4,
    price: price,
    inclusions: inclusions.length > 0 ? inclusions : undefined,
    whatToBring: whatToBring.length > 0 ? whatToBring : undefined,
    whatToKnow: form.whatToKnow || undefined,
  };
}

/**
 * Normalize ExperienceResponse from API
 */
export function normalizeExperienceResponse(
  exp: ExperienceResponse,
  photos: ExperiencePhoto[]
): NormalizedExperienceData {
  return {
    id: exp.id,
    title: exp.title || 'Untitled Experience',
    description: exp.description || 'No description provided.',
    promise: exp.promise,
    uniqueElement: exp.unique_element,
    hostStory: exp.host_story,
    domain: exp.experience_domain || '',
    theme: exp.experience_theme,
    neighborhood: exp.neighborhood || '',
    meetingPoint: exp.meeting_landmark,
    meetingPointDetails: exp.meeting_point_details,
    latitude: exp.latitude,
    longitude: exp.longitude,
    duration: exp.duration_minutes || 180,
    minCapacity: exp.traveler_min_capacity,
    maxCapacity: exp.traveler_max_capacity,
    price: exp.price_inr || 0,
    inclusions: exp.inclusions && exp.inclusions.length > 0 ? exp.inclusions : undefined,
    whatToBring:
      exp.traveler_should_bring && exp.traveler_should_bring.length > 0
        ? exp.traveler_should_bring
        : undefined,
    whatToKnow: exp.experience_safety_guidelines,
    accessibilityNotes:
      exp.accessibility_notes && exp.accessibility_notes.length > 0
        ? exp.accessibility_notes
        : undefined,
    weatherContingency: exp.weather_contingency_plan,
    safetyGuidelines: exp.experience_safety_guidelines,
    status: exp.status,
    adminFeedback: exp.admin_feedback,
    createdAt: exp.created_at,
    updatedAt: exp.updated_at,
    routeData: exp.route_data && exp.route_data.waypoints
      ? { waypoints: exp.route_data.waypoints }
      : undefined,
  };
}

/**
 * Normalize ModeratorExperience from moderator dashboard
 */
export function normalizeModeratorExperience(
  exp: ModeratorExperience,
  photos: ExperiencePhoto[]
): NormalizedExperienceData {
  return {
    id: exp.id,
    title: exp.title || 'Untitled Experience',
    description: exp.description || 'No description provided.',
    promise: exp.promise,
    uniqueElement: exp.unique_element,
    domain: exp.experience_domain || '',
    neighborhood: exp.neighborhood || '',
    meetingPoint: exp.meeting_landmark,
    meetingPointDetails: exp.meeting_point_details,
    duration: exp.duration_minutes || 180,
    maxCapacity: exp.traveler_max_capacity,
    price: exp.price_inr || 0,
    inclusions: exp.inclusions && exp.inclusions.length > 0 ? exp.inclusions : undefined,
    whatToBring:
      exp.traveler_should_bring && exp.traveler_should_bring.length > 0
        ? exp.traveler_should_bring
        : undefined,
    safetyGuidelines: exp.experience_safety_guidelines,
    status: exp.status,
    moderatorFeedback: exp.moderator_feedback,
    adminFeedback: exp.admin_feedback,
    createdAt: exp.created_at,
    updatedAt: exp.updated_at,
    routeData: exp.route_data && exp.route_data.waypoints
      ? { waypoints: exp.route_data.waypoints }
      : undefined,
  };
}

/**
 * Normalize HostExperience from profile page
 * REQUIRES fullDetails parameter (caller must fetch via experienceAPI.getExperience)
 */
export function normalizeHostExperience(
  exp: HostExperience,
  fullDetails: ExperienceResponse
): NormalizedExperienceData {
  // Use fullDetails for complete data, exp for summary fields
  return {
    id: exp.id,
    title: fullDetails.title || exp.title || 'Untitled Experience',
    description: fullDetails.description || 'No description provided.',
    promise: fullDetails.promise,
    uniqueElement: fullDetails.unique_element,
    hostStory: fullDetails.host_story,
    domain: fullDetails.experience_domain || exp.domain || '',
    theme: fullDetails.experience_theme,
    neighborhood: fullDetails.neighborhood || exp.neighborhood || '',
    meetingPoint: fullDetails.meeting_landmark,
    meetingPointDetails: fullDetails.meeting_point_details,
    duration: fullDetails.duration_minutes || 180,
    minCapacity: fullDetails.traveler_min_capacity,
    maxCapacity: fullDetails.traveler_max_capacity,
    price: fullDetails.price_inr || exp.price_inr || 0,
    inclusions:
      fullDetails.inclusions && fullDetails.inclusions.length > 0
        ? fullDetails.inclusions
        : undefined,
    whatToBring:
      fullDetails.traveler_should_bring && fullDetails.traveler_should_bring.length > 0
        ? fullDetails.traveler_should_bring
        : undefined,
    whatToKnow: fullDetails.experience_safety_guidelines,
    accessibilityNotes:
      fullDetails.accessibility_notes && fullDetails.accessibility_notes.length > 0
        ? fullDetails.accessibility_notes
        : undefined,
    weatherContingency: fullDetails.weather_contingency_plan,
    safetyGuidelines: fullDetails.experience_safety_guidelines,
    status: fullDetails.status,
    adminFeedback: fullDetails.admin_feedback,
    createdAt: fullDetails.created_at || exp.created_at,
    updatedAt: fullDetails.updated_at,
    routeData: fullDetails.route_data && fullDetails.route_data.waypoints
      ? { waypoints: fullDetails.route_data.waypoints }
      : undefined,
  };
}

/**
 * Convert ExperiencePhoto[] to PhotoArray format
 */
export function convertPhotosToArray(photos: ExperiencePhoto[]): PhotoArray {
  return photos.map((photo) => ({
    id: photo.id,
    url: photo.photo_url,
    isCover: photo.is_cover_photo,
    caption: photo.caption,
  }));
}

/**
 * Convert photos record (Record<string, string>) to PhotoArray format
 * Used for host dashboard where photos are stored as ID -> URL mapping
 */
export function convertPhotosRecordToArray(
  photosRecord: Record<string, string>,
  experienceId: string
): PhotoArray {
  const entries = Object.entries(photosRecord);
  if (entries.length === 0) {
    return [];
  }

  // First photo is cover photo by convention
  return entries.map(([id, url], index) => ({
    id: id || `${experienceId}-${index}`,
    url: url,
    isCover: index === 0,
    caption: undefined,
  }));
}

/**
 * Helper: Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} minutes`;
}

/**
 * Helper: Format price in INR
 */
export function formatPrice(price: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Helper: Get category display name from domain
 */
export function getCategoryDisplayName(domain: string): string {
  const domainMap: Record<string, string> = {
    food: 'Food & Drink',
    culture: 'Culture & History',
    adventure: 'Adventure',
    nature: 'Nature & Outdoors',
    wellness: 'Wellness & Spa',
    nightlife: 'Nightlife',
    shopping: 'Shopping',
    art: 'Arts & Crafts',
    music: 'Music & Entertainment',
    sports: 'Sports & Fitness',
  };

  return domainMap[domain.toLowerCase()] || domain;
}

