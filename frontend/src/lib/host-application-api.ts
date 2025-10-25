export interface SampleExperience {
  title: string;
  description: string;
  duration: number; // minutes
  max_participants: number;
}

export interface AvailabilityPreferences {
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  time_preference: 'morning' | 'afternoon' | 'evening' | 'flexible';
  additional_notes?: string;
}

export interface HostApplicationSubmission {
  experience_domains: string[];
  hosting_experience: string;
  why_host: string;
  sample_experience_idea: SampleExperience;
  availability: AvailabilityPreferences;
  languages_spoken: string[];
  special_skills?: string;
  background_check_consent: boolean;
  terms_accepted: boolean;
  marketing_consent?: boolean;
  // EIP-712 policy acceptances for audit trail
  policy_acceptances?: any[]; // Will be PolicyAcceptanceRecord[] from eip712-policy-api
}

export interface HostApplication {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  application_data: HostApplicationSubmission;
  admin_notes?: string;
  admin_feedback?: string;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface EligibilityResponse {
  eligible: boolean;
  reason?: string;
  message: string;
  application_id?: string;
  applied_at?: string;
  can_reapply_at?: string;
  legal_documents?: {
    terms_conditions: {
      id: string;
      title: string;
      version: string;
      summary: string;
    };
    background_verification: {
      id: string;
      title: string;
      version: string;
      summary: string;
    };
  };
  next_steps?: string[];
}

import { api } from './api';

// Using centralized api instance with proxy support

// Check host application eligibility
export const checkHostEligibility = async (): Promise<EligibilityResponse> => {
  console.log('🔍 Checking host eligibility...');
  
  try {
    const response = await api.get('/users/host-application/eligibility');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in to check eligibility');
    }
    throw new Error(`Failed to check eligibility: ${error.message}`);
  }
};

// Submit host application
export const submitHostApplication = async (application: HostApplicationSubmission): Promise<HostApplication> => {
  console.log('📝 Submitting host application...', application);

  try {
    const response = await api.post('/users/host-application', application);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in to submit application');
    }
    throw new Error(error.response?.data?.message || `Failed to submit application: ${error.message}`);
  }
};

// Get current user's host application
export const getMyHostApplication = async (): Promise<HostApplication | null> => {
  console.log('📋 Fetching my host application...');

  try {
    const response = await api.get('/users/host-application');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in to view application');
    }
    if (error.response?.status === 404) {
      return null; // No application found
    }
    throw new Error(`Failed to fetch application: ${error.message}`);
  }
};