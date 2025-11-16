export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dwellMinutes: number;
  notes: string;
  accessibilityNotes?: string;
  backupStop?: {
    name: string;
    lat: number;
    lng: number;
  };
}

export interface Route {
  meetingPoint: {
    name: string;
    lat: number;
    lng: number;
    landmark: string;
    arrivalInstructions: string;
    landmarkPhoto?: string;
  };
  stops: Stop[];
  totalDuration: number; // in minutes
  isSingleLocation: boolean;
}

export interface ScheduleSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
}

export interface Blocker {
  id: string;
  field: string;
  message: string;
  severity: "error" | "warning";
  fixAction?: () => void;
}

export interface ExperienceFormState {
  // Step 1: Basics
  title: string;
  description: string;
  category: string;
  theme: string;
  duration: number; // in minutes
  capacity: number;
  neighborhood: string;
  meetingPoint: string;
  requirements: string;

  // Step 2: Media
  coverImage: string | null;
  galleryImages: string[];

  // Step 3: Logistics
  route: Route | null;
  scheduleSlots: ScheduleSlot[];
  basePrice: number;

  // Step 4: Policies
  ageRestriction: number | null;
  cancellationPolicy: "flexible" | "moderate" | "strict";
  permits: string[];

  // Meta
  qualityScore: number; // 0-100
  blockers: Blocker[];
}

export interface AISuggestion {
  id: string;
  field: keyof ExperienceFormState;
  currentValue: any;
  suggestedValue: any;
  reasoning: string;
  confidence: number; // 0-100
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: AISuggestion[];
  timestamp: Date;
}
