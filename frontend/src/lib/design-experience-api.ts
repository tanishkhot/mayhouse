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

export type QAAnswer = {
  question_id: string;
  question_text: string;
  answer: string | null;
  structured_data?: Record<string, any>;
  photo_ids?: string[];
  answered_at: string;
  character_count?: number;
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

  /**
   * Save Q&A answers to a design session
   */
  saveQAAnswers: (sessionId: string, qaAnswers: QAAnswer[]) =>
    api.patch(`/design-experience/session/${sessionId}/qa-answers`, {
      session_id: sessionId,
      qa_answers: qaAnswers,
    }).then((r) => r.data),

  /**
   * Generate experience fields from Q&A answers
   */
  generateFromQA: (qaAnswers: QAAnswer[]) =>
    api.post<ExperienceGenerationResponse>('/design-experience/generate-from-qa', {
      qa_answers: qaAnswers,
    }).then((r) => r.data),
};

