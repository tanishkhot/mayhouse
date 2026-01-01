import { api } from './api';

export type ExperienceStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';

export type ExperienceResponse = {
  id: string;
  title: string;
  promise?: string;
  description: string;
  unique_element?: string;
  host_story?: string;
  experience_domain: string;
  experience_theme?: string;
  neighborhood: string;
  meeting_landmark?: string;
  meeting_point_details?: string;
  latitude?: number;
  longitude?: number;
  route_data?: any;
  first_event_run_date?: string;
  first_event_run_time?: string;
  duration_minutes: number;
  traveler_min_capacity?: number;
  traveler_max_capacity?: number;
  price_inr: number;
  inclusions?: string[];
  traveler_should_bring?: string[];
  accessibility_notes?: string[];
  weather_contingency_plan?: string;
  photo_sharing_consent_required?: boolean;
  experience_safety_guidelines?: string;
  status: ExperienceStatus;
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
};

export type ExperienceCreate = {
  title: string;
  promise: string;
  description: string;
  unique_element: string;
  host_story: string;
  experience_domain: string;
  experience_theme?: string;
  country?: string;
  city?: string;
  neighborhood?: string;
  meeting_landmark: string;
  meeting_point_details: string;
  latitude?: number;
  longitude?: number;
  route_data?: any;
  first_event_run_date?: string;
  first_event_run_time?: string;
  duration_minutes: number;
  traveler_min_capacity?: number;
  traveler_max_capacity: number;
  price_inr: number;
  inclusions: string[];
  traveler_should_bring?: string[];
  accessibility_notes?: string[];
  weather_contingency_plan?: string;
  photo_sharing_consent_required?: boolean;
  experience_safety_guidelines?: string;
};

export type ExperienceUpdate = {
  title?: string;
  promise?: string;
  description?: string;
  unique_element?: string;
  host_story?: string;
  experience_domain?: string;
  experience_theme?: string;
  country?: string;
  city?: string;
  neighborhood?: string;
  meeting_landmark?: string;
  meeting_point_details?: string;
  latitude?: number;
  longitude?: number;
  route_data?: any;
  first_event_run_date?: string;
  first_event_run_time?: string;
  duration_minutes?: number;
  traveler_min_capacity?: number;
  traveler_max_capacity?: number;
  price_inr?: number;
  inclusions?: string[];
  traveler_should_bring?: string[];
  accessibility_notes?: string[];
  weather_contingency_plan?: string;
  photo_sharing_consent_required?: boolean;
  experience_safety_guidelines?: string;
};

export const experienceAPI = {
  // Get host's experiences (JWT authenticated)
  getHostExperiences: (limit: number = 50, offset: number = 0) =>
    api.get<ExperienceResponse[]>(`/experiences/my?limit=${limit}&offset=${offset}`).then((r) => r.data),

  // Get specific experience
  getExperience: (experienceId: string) =>
    api.get<ExperienceResponse>(`/experiences/${experienceId}`).then((r) => r.data),

  // Create new experience
  createExperience: (experienceData: ExperienceCreate) =>
    api.post<ExperienceResponse>('/experiences', experienceData).then((r) => r.data),

  // Update existing experience
  updateExperience: async (experienceId: string, experienceData: ExperienceUpdate, hostId: string) => {
    // Backend expects ExperienceUpdateRequest with host_id and update_data
    const response = await api.put<ExperienceResponse>(`/experiences/${experienceId}`, {
      host_id: hostId,
      update_data: experienceData,
    });
    return response.data;
  },
};