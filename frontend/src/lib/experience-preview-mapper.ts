import { ExperienceCardProps } from '@/components/landing/ExperienceCard';
import { FormState } from './experience-mapper';
import { UserResponse } from './api';

/**
 * Format duration in minutes to a human-readable string
 * Examples: 60 -> "1 hour", 180 -> "3 hours", 90 -> "1.5 hours"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = minutes / 60;
  if (hours === 1) {
    return '1 hour';
  }
  
  // Check if it's a whole number
  if (hours % 1 === 0) {
    return `${hours} hours`;
  }
  
  // For half hours, show as decimal
  return `${hours} hours`;
}

/**
 * Format group size from min/max capacity to a human-readable string
 * Examples: (1, 4) -> "1-4 people", (2, 2) -> "2 people"
 */
export function formatGroupSize(min: number, max: number): string {
  if (min === max) {
    return `${min} ${min === 1 ? 'person' : 'people'}`;
  }
  return `${min}-${max} people`;
}

/**
 * Format location from neighborhood, city, and country
 * Examples: ("Colaba", "Mumbai", "India") -> "Colaba, Mumbai"
 *           (null, "Mumbai", "India") -> "Mumbai, India"
 */
export function formatLocation(
  neighborhood?: string | null,
  city?: string | null,
  country?: string | null
): string {
  const parts: string[] = [];
  
  if (neighborhood && neighborhood.trim()) {
    parts.push(neighborhood.trim());
  }
  
  if (city && city.trim()) {
    parts.push(city.trim());
  } else if (country && country.trim()) {
    parts.push(country.trim());
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
}

/**
 * Derive tags from experience domain and theme
 * Returns an array of tag strings for the marketplace card
 */
export function deriveTags(domain?: string, theme?: string): string[] {
  const tags: string[] = [];
  
  // Map domain to display name and add as tag
  if (domain) {
    const domainMap: Record<string, string> = {
      food: 'Food & Culinary',
      culture: 'Culture & Heritage',
      art: 'Art & Creativity',
      history: 'History & Stories',
      music: 'Music & Entertainment',
      architecture: 'Architecture',
      street_art: 'Street Art',
      local_life: 'Local Life',
      markets: 'Markets',
      spiritual: 'Spiritual',
      nightlife: 'Nightlife',
      photography: 'Photography',
    };
    
    const domainTag = domainMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
    tags.push(domainTag);
  }
  
  // Add theme as a tag if provided
  if (theme && theme.trim()) {
    tags.push(theme.trim());
  }
  
  return tags;
}

/**
 * Get category display name from domain
 */
export function getCategoryDisplayName(domain: string): string {
  const domainMap: Record<string, string> = {
    food: 'Food & Culinary',
    culture: 'Culture & Heritage',
    art: 'Art & Creativity',
    history: 'History & Stories',
    music: 'Music & Entertainment',
    architecture: 'Architecture',
    street_art: 'Street Art',
    local_life: 'Local Life',
    markets: 'Markets',
    spiritual: 'Spiritual',
    nightlife: 'Nightlife',
    photography: 'Photography',
  };
  
  return domainMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
}

/**
 * Map form state and user data to ExperienceCardProps for preview
 */
export function mapFormToCardProps(
  form: FormState,
  host: UserResponse | null,
  coverImage?: string | null
): ExperienceCardProps {
  // Get cover image from photos array or use provided coverImage, or default placeholder
  const image = coverImage || '/experience-placeholder.png';
  
  // Format host data
  const hostData = {
    name: host?.full_name || 'Host',
    avatar: host?.profile_image_url || '/user-image.png',
    verified: host?.role === 'host' || host?.role === 'admin' || false,
  };
  
  // Format duration (ensure valid number, default to 180)
  const durationMinutes = form.duration && form.duration > 0 ? form.duration : 180;
  const duration = formatDuration(durationMinutes);
  
  // Format group size (default min capacity is 1, ensure max is valid)
  const maxCapacity = form.maxCapacity && form.maxCapacity > 0 ? form.maxCapacity : 4;
  const groupSize = formatGroupSize(1, maxCapacity);
  
  // Format location (use defaults if not provided)
  const location = formatLocation(
    form.neighborhood || null,
    'Mumbai',
    'India'
  );
  
  // Get category display name (default to 'Experience' if domain is empty)
  const category = form.domain && form.domain.trim() 
    ? getCategoryDisplayName(form.domain) 
    : 'Experience';
  
  // Get description (use first 150 chars of description)
  const description = form.description && form.description.trim()
    ? form.description.substring(0, 150)
    : undefined;
  
  // Derive tags (only if domain is provided)
  const tags = form.domain && form.domain.trim() 
    ? deriveTags(form.domain, form.theme) 
    : [];
  
  // Parse price (ensure valid number, default to 0 for preview)
  const price = form.price && form.price.trim()
    ? parseFloat(form.price) || 0
    : 0;
  
  return {
    id: `preview-${Date.now()}`,
    title: form.title || 'Untitled Experience',
    host: hostData,
    image,
    category,
    duration,
    groupSize,
    price,
    priceLocale: 'en-IN',
    currencySymbol: '₹',
    priceSuffix: ' per person',
    location,
    description,
    tags,
    // Rating and reviews omitted for new experiences
  };
}

