import type { HostApplication } from './host-application-api';
import { api } from './api';

// Using centralized api instance with proxy support

export interface HostApplicationSummary {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  experience_domains: string[];
  applied_at: string;
  reviewed_at?: string;
}

export interface AdminFeedback {
  decision_reason: string;
  strengths?: string[];
  improvements?: string[];
  next_steps?: string;
}

export interface HostApplicationReview {
  decision: 'approved' | 'rejected';
  admin_notes?: string;
  feedback: AdminFeedback;
}

export interface HostApplicationStats {
  total_applications: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  applications_this_month: number;
  avg_review_time_days?: number;
}

// Get list of host applications for admin review
export const getHostApplications = async (status?: 'pending' | 'approved' | 'rejected', limit: number = 50, offset: number = 0): Promise<HostApplicationSummary[]> => {
  console.log('🔍 Fetching host applications for admin review...');

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  
  try {
    const response = await api.get(`/admin/host-applications?${params}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in as admin');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }
};

// Get detailed information about a specific host application
export const getHostApplicationDetails = async (applicationId: string): Promise<HostApplication> => {
  console.log('🔍 Fetching host application details...', applicationId);

  try {
    const response = await api.get(`/admin/host-applications/${applicationId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in as admin');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error(`Failed to fetch application details: ${error.message}`);
  }
};

// Review a host application (approve or reject)
export const reviewHostApplication = async (applicationId: string, review: HostApplicationReview): Promise<HostApplication> => {
  console.log('📝 Reviewing host application...', applicationId, review);

  try {
    const response = await api.post(`/admin/host-applications/${applicationId}/review`, review);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in as admin');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error(error.response?.data?.message || `Failed to review application: ${error.message}`);
  }
};

// Get host application statistics
export const getHostApplicationStats = async (): Promise<HostApplicationStats> => {
  console.log('📊 Fetching host application statistics...');

  try {
    const response = await api.get('/admin/host-applications/stats');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      localStorage.removeItem('mayhouse_token');
      window.location.href = '/login';
      throw new Error('Please log in as admin');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error(`Failed to fetch statistics: ${error.message}`);
  }
};