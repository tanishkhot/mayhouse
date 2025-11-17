import { api } from './api';

// Types for experience generation
export type ExperienceGenerationRequest = {
  description: string;
};

export type ExperienceGenerationResponse = {
  title: string;
  description: string;
  what_to_expect: string;
  domain: string;
  theme: string | null;
  duration_minutes: number;
  max_capacity: number;
  price_inr: number | null;
  neighborhood: string | null;
  meeting_point: string | null;
  requirements: string[] | null;
  what_to_bring: string[] | null;
  what_to_know: string | null;
};

// Design Experience API
export const DesignExperienceAPI = {
  /**
   * Generate experience fields from a natural language description
   */
  generateExperience: (description: string) =>
    api.post<ExperienceGenerationResponse>('/design-experience/generate', {
      description,
    }).then((r) => r.data),
};

