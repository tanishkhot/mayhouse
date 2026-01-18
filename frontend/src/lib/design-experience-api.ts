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

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

export type ChatRequest = {
  message: string;
  conversation_history?: ChatMessage[];
  form_context?: Record<string, any>;
};

export type FieldSuggestionResponse = {
  field: string;
  current_value: any;
  suggested_value: any;
  reasoning: string;
  confidence: number;
  auto_apply_safe: boolean;
  change_type: 'replace' | 'append' | 'refine' | 'generate';
};

export type ChatResponse = {
  response: string;
  suggestions?: FieldSuggestionResponse[];
  applied_changes?: any[];
  confidence: number;
  reasoning?: string;
  next_steps?: string[];
  intent?: string;
  detected_fields?: string[];
};

export type DesignSessionStartResponse = {
  session_id: string;
  experience_id: string;
  step: number;
  incomplete_fields: Record<string, string[]>;
  created_at: string;
  updated_at: string;
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

  /**
   * Start a new design session
   */
  startSession: (experienceId?: string) =>
    api.post<DesignSessionStartResponse>('/design-experience/session', {
      experience_id: experienceId || null,
    }).then((r) => r.data),

  /**
   * Send chat message to AI assistant
   */
  sendChatMessage: (sessionId: string, request: ChatRequest) =>
    api.post<ChatResponse>(`/design-experience/session/${sessionId}/chat`, request)
      .then((r) => r.data),
};

