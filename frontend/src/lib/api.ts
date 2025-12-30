import axios from "axios";

// Base API URL - always use Next.js API proxy to avoid CORS issues
// The proxy handles routing to the correct backend (localhost in dev, EC2 in prod)
const BASE_URL = "/api/proxy";

// Debug logs removed for production

// Token storage helpers with better error handling and debugging
export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("mayhouse_token"); // Use consistent key
    // Token retrieval - logs removed
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const getAnonymousUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = "mayhouse_anonymous_user_id";
    let anonId = localStorage.getItem(storageKey);
    if (!anonId) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        anonId = crypto.randomUUID();
      } else {
        const s4 = () =>
          Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        anonId = `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
      }
      localStorage.setItem(storageKey, anonId);
    }
    return anonId;
  } catch (error) {
    console.error("Error getting anonymous user id:", error);
    return null;
  }
};

export const setAccessToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("mayhouse_token", token); // Use consistent key
    } else {
      localStorage.removeItem("mayhouse_token"); // Use consistent key
    }
  } catch (error) {
    console.error('Error setting access token:', error);
  }
};

// Clear all authentication data from localStorage
export const clearAuthData = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("mayhouse_token");
    localStorage.removeItem("access_token"); // Remove old key too
    localStorage.removeItem("mayhouse_host_status"); // Clear cached host status
    localStorage.removeItem("mayhouse_user_role"); // Clear cached user role
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Host status caching helpers
export const getCachedHostStatus = (): boolean | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem("mayhouse_host_status");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error getting cached host status:', error);
    return null;
  }
};

export const setCachedHostStatus = (isApprovedHost: boolean) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mayhouse_host_status", JSON.stringify(isApprovedHost));
  } catch (error) {
    console.error('Error setting cached host status:', error);
  }
};

export const getCachedUserRole = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("mayhouse_user_role");
  } catch (error) {
    console.error('Error getting cached user role:', error);
    return null;
  }
};

export const setCachedUserRole = (role: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mayhouse_user_role", role);
  } catch (error) {
    console.error('Error setting cached user role:', error);
  }
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  config.headers = config.headers || {};
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  } else {
    const anonId = getAnonymousUserId();
    if (anonId) {
      config.headers["X-Anonymous-User-Id"] = anonId;
    }
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken(null);
      // Don't redirect here as it might cause infinite loops
    }
    return Promise.reject(error);
  }
);

// Types based on OpenAPI schema
export enum UserRole {
  USER = "user",
  HOST = "host",
  ADMIN = "admin"
}

export type AuthResponse = {
  user: UserResponse;
  access_token: string;
  token_type: string; // defaults to "bearer"
  expires_in: number;
  refresh_token?: string | null;
};

export type UserResponse = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  username?: string | null;
  bio?: string | null;
  role: UserRole;
  profile_image_url?: string | null;
  preferences?: Record<string, any> | null;
  email_confirmed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type UserCreate = {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
};

export type UserLogin = {
  email: string;
  password: string;
};

export type UserUpdate = {
  full_name?: string | null;
  phone?: string | null;
  username?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  preferences?: Record<string, any> | null;
};

export const AuthAPI = {
  signup: (payload: UserCreate) =>
    api.post<AuthResponse>("/auth/signup", payload).then((r) => r.data),
  login: (payload: UserLogin) =>
    api.post<AuthResponse>("/login", payload).then((r) => r.data),
  me: () => api.get<UserResponse>("/auth/me").then((r) => r.data),
  updateMe: (payload: UserUpdate) =>
    api.put<UserResponse>("/auth/me", payload).then((r) => r.data),
  logout: async () => {
    try {
      // Call backend logout endpoint to blacklist the token
      const response = await api.post<Record<string, string>>("/auth/logout");
      return response.data;
    } catch {
      // Continue with local logout even if backend fails
      // Error is intentionally ignored to ensure local logout always happens
    } finally {
      // Always clear local storage regardless of backend response
      clearAuthData();
    }
  },
  googleOAuthLoginUrl: () => `${BASE_URL}/auth/oauth/google/login`,
  // Also available in profile routes
  getUserProfile: () => api.get<UserResponse>("/users/profile").then((r) => r.data),
  updateUserProfile: (payload: UserUpdate) =>
    api.put<UserResponse>("/users/profile", payload).then((r) => r.data),
};

// Explore/Discovery API
export type ExploreEventRun = {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_capacity: number;
  available_spots: number;
  price_inr: string;
  status: EventRunStatus;
  experience_id: string;
  experience_title: string;
  experience_promise?: string | null;
  experience_domain: string;
  experience_theme?: string | null;
  neighborhood?: string | null;
  meeting_landmark?: string | null;
  duration_minutes: number;
  cover_photo_url?: string | null;
  host_id: string;
  host_name: string;
  host_meeting_instructions?: string | null;
  group_pairing_enabled: boolean;
};

export enum EventRunStatus {
  SCHEDULED = "scheduled",
  LOW_SEATS = "low_seats",
  SOLD_OUT = "sold_out",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export const ExploreAPI = {
  getUpcomingExperiences: (params?: {
    domain?: string;
    neighborhood?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.domain) searchParams.append("domain", params.domain);
    if (params?.neighborhood) searchParams.append("neighborhood", params.neighborhood);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    
    const queryString = searchParams.toString();
    const url = `/explore/${queryString ? `?${queryString}` : ""}`;
    console.log('🔍 Fetching explore data from:', url);
    return api.get<ExploreEventRun[]>(url).then((r) => {
      console.log('✅ Explore API response:', r.data?.length || 0, 'event runs');
      return r.data;
    }).catch((error) => {
      console.error('❌ Explore API error:', error.response?.data || error.message);
      throw error;
    });
  },
  getCategories: () =>
    api.get<Record<string, any>>("/explore/categories").then((r) => r.data),
  getFeaturedExperiences: (limit = 5) =>
    api.get<Record<string, any>>(`/explore/featured?limit=${limit}`).then((r) => r.data),
  getExperienceDetails: (experienceId: string) =>
    api.get<Record<string, any>>(`/explore/${experienceId}`).then((r) => r.data),
};

// Profile-related API
export type PublicProfile = {
  id: string;
  full_name: string;
  username?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  wallet_address?: string | null;
  role: UserRole;
  created_at: string;
  email?: string; // Only included for own profile
  host_stats?: {
    experience_count: number;
    event_run_count: number;
    travelers_hosted: number;
    avg_rating?: number | null;
    review_count: number;
    years_hosting: number;
    response_rate?: number | null;
  };
  host_application?: {
    languages_spoken?: string[];
    hosting_experience?: string;
    why_host?: string;
    special_skills?: string;
  };
};

export type HostExperience = {
  id: string;
  title: string;
  domain: string;
  price_inr: number;
  neighborhood?: string | null;
  city: string;
  cover_photo_url?: string | null;
  created_at: string;
};

export type HostExperiencesResponse = {
  experiences: HostExperience[];
  count: number;
  limit: number;
  offset: number;
};

export type HostStats = {
  experience_count: number;
  event_run_count: number;
  travelers_hosted: number;
  avg_rating?: number | null;
  review_count: number;
  years_hosting: number;
  response_rate?: number | null;
};

export const ProfileAPI = {
  getPublicProfile: (userId: string) =>
    api.get<PublicProfile>(`/users/${userId}/profile`).then((r) => r.data),
  getHostExperiences: (userId: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    
    const url = `/users/${userId}/experiences${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return api.get<HostExperiencesResponse>(url).then((r) => r.data);
  },
  getHostStats: (userId: string) =>
    api.get<HostStats>(`/users/${userId}/stats`).then((r) => r.data),
  getOwnProfile: () =>
    api.get<PublicProfile>("/users/profile").then((r) => r.data),
  updateOwnProfile: (updateData: UserUpdate) =>
    api.put<PublicProfile>("/users/profile", updateData).then((r) => r.data),
  getBookings: (params?: { status_filter?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status_filter) searchParams.append("status_filter", params.status_filter);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    
    const url = `/bookings/my${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return api.get<Record<string, any>>(url).then((r) => r.data);
  },
  getFavorites: (limit = 10) =>
    api.get<Record<string, any>>(`/users/favorites?limit=${limit}`).then((r) => r.data),
  addToFavorites: (experienceId: string) =>
    api.post<Record<string, any>>(`/users/favorites/${experienceId}`).then((r) => r.data),
  removeFromFavorites: (experienceId: string) =>
    api.delete<Record<string, any>>(`/users/favorites/${experienceId}`).then((r) => r.data),
  getNotifications: (params?: { unread_only?: boolean; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.unread_only !== undefined) searchParams.append("unread_only", params.unread_only.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    
    const url = `/users/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return api.get<Record<string, any>>(url).then((r) => r.data);
  },
};

// Host Application API types
export enum ApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export type HostApplicationResponse = {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  application_data: Record<string, any>;
  admin_notes?: string | null;
  admin_feedback?: Record<string, any> | null;
  applied_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export const HostApplicationAPI = {
  checkEligibility: () =>
    api.get<Record<string, any>>("/users/host-application/eligibility").then((r) => r.data),
  getMyApplication: () =>
    api.get<HostApplicationResponse | null>("/users/host-application").then((r) => r.data),
  submitApplication: (applicationData: Record<string, any>) =>
    api.post<HostApplicationResponse>("/users/host-application", applicationData).then((r) => r.data),
  // Helper function to check if user is an approved host
  isApprovedHost: async (): Promise<boolean> => {
    try {
      const application = await HostApplicationAPI.getMyApplication();
      const isApproved = application?.status === ApplicationStatus.APPROVED;
      // Cache the result for faster future loads
      setCachedHostStatus(isApproved);
      return isApproved;
    } catch (error) {
      console.error('Failed to check host application status:', error);
      return false;
    }
  },
};

// Design Experience (session-based) API
export const DesignExperienceAPI = {
  startSession: (experienceId?: string | null) =>
    api.post<Record<string, any>>("/design-experience/session", {
      experience_id: experienceId || null,
    }).then((r) => r.data),

  upsertBasics: (sessionId: string, payload: {
    title?: string;
    description?: string;
    what_to_expect?: string;
    domain?: string;
    theme?: string;
    duration_minutes?: number;
  }) =>
    api.patch<Record<string, any>>(`/design-experience/session/${sessionId}/basics`, payload)
      .then((r) => r.data),

  uploadMedia: (sessionId: string, file: File, isCoverPhoto = false, caption?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_cover_photo", String(isCoverPhoto));
    if (caption) formData.append("caption", caption);
    return api.post<Record<string, any>>(
      `/design-experience/session/${sessionId}/media`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((r) => r.data);
  },

  reorderMedia: (sessionId: string, order: string[]) =>
    api.patch<Record<string, any>>(`/design-experience/session/${sessionId}/media`, { order })
      .then((r) => r.data),

  upsertLogistics: (sessionId: string, payload: {
    neighborhood?: string;
    meeting_point?: string;
    latitude?: number;
    longitude?: number;
    traveler_max_capacity?: number;
    price_inr?: number;
    requirements?: string[] | null;
    what_to_bring?: string[] | null;
    safety_guidelines?: string | null;
  }) =>
    api.patch<Record<string, any>>(`/design-experience/session/${sessionId}/logistics`, payload)
      .then((r) => r.data),

  getReview: (sessionId: string) =>
    api.get<Record<string, any>>(`/design-experience/session/${sessionId}/review`)
      .then((r) => r.data),

  submit: (sessionId: string) =>
    api.post<Record<string, any>>(`/design-experience/session/${sessionId}/submit`)
      .then((r) => r.data),
};
