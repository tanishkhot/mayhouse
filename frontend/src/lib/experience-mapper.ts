import { ExperienceCreate, ExperienceResponse } from './experience-api';

/**
 * Form state type matching DesignExperienceV2
 */
export type FormState = {
  title: string;
  description: string;
  domain: string;
  theme: string;
  duration: number;
  firstEventRunDate?: string;
  firstEventRunTime?: string;
  maxCapacity: number;
  price: string;
  neighborhood: string;
  meetingPoint: string;
  latitude?: number;
  longitude?: number;
  waypoints?: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    type: 'start' | 'stop' | 'end';
    description?: string;
  }>;
  requirements: string;
  whatToExpect: string;
  whatToKnow: string;
  whatToBring: string;
};

/**
 * Maps form state to ExperienceCreate format for API
 * Handles missing fields by generating defaults or extracting from existing data
 */
export function mapFormToExperienceCreate(form: FormState): ExperienceCreate {
  // Generate promise from description (first 200 chars, or create a summary)
  const promise = form.description.length >= 20
    ? form.description.substring(0, 200)
    : `${form.title}. ${form.description}`.substring(0, 200);

  // Extract meeting landmark from meeting point (first part before comma, or full string)
  const meetingLandmark = form.meetingPoint.includes(',')
    ? form.meetingPoint.split(',')[0].trim()
    : form.meetingPoint.trim() || 'Meeting point to be confirmed';

  // Ensure meeting_point_details is not empty (required field)
  const meetingPointDetails = form.meetingPoint.trim() || 'Meeting point details to be confirmed';

  // Map domain to valid enum value (default to "culture" if not matching)
  // Valid domains: food, culture, history, art, music, architecture, street_art, local_life, markets, spiritual, nightlife, photography
  const validDomains = ['food', 'culture', 'history', 'art', 'music', 'architecture', 'street_art', 'local_life', 'markets', 'spiritual', 'nightlife', 'photography'];
  const normalizedDomain = form.domain && validDomains.includes(form.domain.toLowerCase()) 
    ? form.domain.toLowerCase() 
    : 'culture'; // Default fallback for invalid domains

  // Ensure price is valid (> 0, required by backend)
  const priceValue = parseFloat(form.price);
  const validPrice = priceValue > 0 ? priceValue : 1000; // Default to 1000 INR if invalid or missing

  // Generate host story if not provided (default based on domain)
  const hostStory = form.whatToExpect
    ? `As a passionate local guide, I created this ${form.domain} experience to share the authentic side of Mumbai with travelers. ${form.whatToExpect.substring(0, 500)}`
    : `As a passionate local guide, I created this ${form.domain} experience to share the authentic side of Mumbai with travelers.`;

  // Ensure host story meets minimum length (50 chars)
  const finalHostStory = hostStory.length >= 50
    ? hostStory.substring(0, 1000)
    : `${hostStory} This experience reflects my deep connection to the local culture and my desire to share authentic moments with travelers.`.substring(0, 1000);

  // Parse inclusions from description or use defaults
  const inclusions = extractInclusions(form.description) || [
    'Professional local guide',
    'All activities mentioned in description'
  ];

  // Convert whatToBring string to array
  const travelerShouldBring = form.whatToBring
    ? form.whatToBring.split(',').map(item => item.trim()).filter(item => item.length > 0)
    : ['Comfortable walking shoes', 'Camera (optional)'];

  // Convert requirements string to array
  const accessibilityNotes = form.requirements
    ? form.requirements.split(',').map(item => item.trim()).filter(item => item.length > 0)
    : [];

  // Ensure unique_element meets minimum length (50 chars)
  const uniqueElement = form.whatToExpect && form.whatToExpect.length >= 50
    ? form.whatToExpect.substring(0, 500)
    : form.description.substring(0, 500);

  return {
    title: form.title,
    promise: promise,
    description: form.description,
    unique_element: uniqueElement,
    host_story: finalHostStory,
    experience_domain: normalizedDomain,
    experience_theme: form.theme || undefined,
    country: 'India', // Default
    city: 'Mumbai', // Default
    neighborhood: form.neighborhood || undefined,
    meeting_landmark: meetingLandmark,
    meeting_point_details: meetingPointDetails,
    latitude: form.latitude,
    longitude: form.longitude,
    route_data: form.waypoints ? { waypoints: form.waypoints } : undefined,
    first_event_run_date: form.firstEventRunDate && form.firstEventRunDate.trim().length > 0 ? form.firstEventRunDate : undefined,
    first_event_run_time: form.firstEventRunTime && form.firstEventRunTime.trim().length > 0 ? form.firstEventRunTime : undefined,
    duration_minutes: form.duration,
    traveler_min_capacity: 1, // Default
    traveler_max_capacity: form.maxCapacity,
    price_inr: validPrice,
    inclusions: inclusions,
    traveler_should_bring: travelerShouldBring.length > 0 ? travelerShouldBring : undefined,
    accessibility_notes: accessibilityNotes.length > 0 ? accessibilityNotes : undefined,
    weather_contingency_plan: undefined, // Optional
    photo_sharing_consent_required: true, // Default
    experience_safety_guidelines: form.whatToKnow || undefined,
  };
}

/**
 * Extract inclusions from description text
 * Looks for patterns like "includes:", "what's included:", etc.
 */
function extractInclusions(description: string): string[] | null {
  // Common patterns for inclusions
  const patterns = [
    /includes?:?\s*([^.]+)/i,
    /what'?s\s+included:?\s*([^.]+)/i,
    /included:?\s*([^.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      // Split by commas, semicolons, or "and"
      const items = match[1]
        .split(/[,;]|\sand\s/i)
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length < 100);
      
      if (items.length > 0) {
        return items;
      }
    }
  }

  return null;
}

/**
 * Maps ExperienceResponse from API to FormState for editing
 * Handles route_data deserialization and array-to-string conversions
 */
export function mapExperienceResponseToForm(experience: ExperienceResponse): FormState {
  // Combine meeting_landmark and meeting_point_details into meetingPoint
  const meetingPoint = experience.meeting_landmark 
    ? (experience.meeting_point_details 
        ? `${experience.meeting_landmark}, ${experience.meeting_point_details}`
        : experience.meeting_landmark)
    : experience.meeting_point_details || '';

  // Convert arrays to comma-separated strings
  const requirements = experience.accessibility_notes?.join(', ') || '';
  const whatToBring = experience.traveler_should_bring?.join(', ') || '';
  
  // Use unique_element as whatToExpect, fallback to promise if unique_element is missing
  const whatToExpect = experience.unique_element || experience.promise || '';
  
  // Deserialize route_data.waypoints if present
  // Ensure waypoints match Waypoint type (name must be string, not optional)
  const waypoints = (experience.route_data?.waypoints || []).map((wp: any) => ({
    id: wp.id || `waypoint-${Date.now()}`,
    lat: wp.lat,
    lng: wp.lng,
    name: wp.name || 'Unnamed Waypoint', // Ensure name is always a string
    type: wp.type || 'stop',
    description: wp.description,
  }));

  return {
    title: experience.title || '',
    description: experience.description || '',
    domain: experience.experience_domain || '',
    theme: experience.experience_theme || '',
    duration: experience.duration_minutes || 180,
    firstEventRunDate: (experience as any).first_event_run_date || '',
    firstEventRunTime: (experience as any).first_event_run_time
      ? String((experience as any).first_event_run_time).slice(0, 5)
      : '',
    maxCapacity: experience.traveler_max_capacity || 4,
    price: experience.price_inr?.toString() || '',
    neighborhood: experience.neighborhood || '',
    meetingPoint: meetingPoint,
    latitude: experience.latitude,
    longitude: experience.longitude,
    waypoints: waypoints,
    requirements: requirements,
    whatToExpect: whatToExpect,
    whatToKnow: experience.experience_safety_guidelines || '',
    whatToBring: whatToBring,
  };
}

