'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHostApplications, reviewHostApplication, getHostApplicationDetails, type HostApplicationSummary, type HostApplicationReview } from '@/lib/admin-api';
import type { HostApplication } from '@/lib/host-application-api';
import { AdminOnlyRoute } from '@/components/ProtectedRoute';
import { ModeratorSkeleton } from '@/components/skeletons';
import { AuthAPI, api, UserResponse } from '@/lib/api';
import type { EventRunSummary } from '@/lib/event-run-api';
import { ExperiencePreviewModal } from '@/components/experience-preview';
import { normalizeModeratorExperience, convertPhotosToArray } from '@/lib/experience-preview-normalizer';
import { ExperiencePhoto } from '@/lib/experience-preview-types';

// Define interfaces for moderator data
interface ModeratorExperience {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  experience_domain: string;
  duration_minutes: number;
  price_inr: number;
  traveler_max_capacity: number;
  promise: string;
  description: string;
  unique_element: string;
  neighborhood: string;
  meeting_landmark: string;
  meeting_point_details: string;
  inclusions: string[];
  traveler_should_bring: string[];
  experience_safety_guidelines: string;
  moderator_feedback?: string;
  admin_feedback?: string;
  route_data?: any;
}

interface ModeratorEventRun {
  id: string;
  experience_id: string;
  experience_title: string;
  status: 'scheduled' | 'low_seats' | 'sold_out' | 'completed' | 'cancelled';
  host_name: string;
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  current_bookings: number;
  max_capacity: number;
  pricing_inr: number;
  experience_price_inr: number;
  location: string;
  experience_neighborhood: string;
  meeting_landmark: string;
  host_meeting_instructions?: string;
  detailed_bookings: Array<{
    id: string;
    user_name: string;
    user_email: string;
    booking_status: string;
    created_at: string;
  }>;
  bookings?: Array<{
    id: string;
    user_name: string;
    user_email: string;
    booking_status: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
  group_pairing_enabled: boolean;
}

const ModeratorDashboard = () => {
  const router = useRouter();
  const [applications, setApplications] = useState<HostApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'experiences' | 'eventruns'>('experiences');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<HostApplicationSummary | HostApplication | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null);
  
  // Experience management state
  const [experiences, setExperiences] = useState<ModeratorExperience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<ModeratorExperience | null>(null);
  const [experienceFilter, setExperienceFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  
  // Preview modal state
  const [previewExperience, setPreviewExperience] = useState<ModeratorExperience | null>(null);
  const [previewPhotos, setPreviewPhotos] = useState<ExperiencePhoto[]>([]);
  const [previewHost, setPreviewHost] = useState<UserResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  // Event Runs management state
  // Using any for now as admin API may return additional fields
  const [eventRuns, setEventRuns] = useState<any[]>([]);
  const [selectedEventRun, setSelectedEventRun] = useState<any | null>(null);
  const [eventRunFilter, setEventRunFilter] = useState<'all' | 'scheduled' | 'low_seats' | 'sold_out' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'experiences') {
      fetchExperiences();
    } else if (activeTab === 'eventruns') {
      fetchEventRuns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, experienceFilter, eventRunFilter, activeTab]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await getHostApplications(statusFilter as 'pending' | 'approved' | 'rejected' | undefined, 50, 0);
      setApplications(data);
    } catch (err: unknown) {
      console.error('Error fetching applications:', err);
      if (err instanceof Error && err.message.includes('Admin access required')) {
        setError('Moderator access required. Please connect your wallet.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const statusParam = experienceFilter === 'all' ? '' : `?status_filter=${experienceFilter}`;
      const response = await api.get(`/admin/experiences${statusParam}`);
      const data = response.data;
      setExperiences(data);
    } catch (err: unknown) {
      console.error('Error fetching experiences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch experiences');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRuns = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const statusParam = eventRunFilter === 'all' ? '' : `?status_filter=${eventRunFilter}`;
      const response = await api.get(`/admin/event-runs${statusParam}`);
      const data = response.data as any[];
      // Sort by start datetime - most recent first
      const sortedRuns = data.sort((a, b) => {
        return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
      });
      setEventRuns(sortedRuns);
    } catch (err: unknown) {
      console.error('Error fetching event runs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch event runs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (applicationId: string) => {
    try {
      const details = await getHostApplicationDetails(applicationId);
      setSelectedApplication(details);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch application details');
    }
  };

  const handleViewExperience = async (experienceId: string) => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Fetch experience details
      const response = await api.get(`/admin/experiences/${experienceId}`);
      const experience = response.data as ModeratorExperience;
      
      // Fetch photos - try admin endpoint first, fallback to regular endpoint
      let photos: ExperiencePhoto[] = [];
      try {
        const photosResponse = await api.get(`/admin/experiences/${experienceId}/photos`);
        photos = photosResponse.data as ExperiencePhoto[];
      } catch (err) {
        // Fallback to regular endpoint if admin endpoint doesn't exist
        try {
          const photosResponse = await api.get(`/experiences/${experienceId}/photos`);
          photos = photosResponse.data as ExperiencePhoto[];
        } catch (err2) {
          console.warn('Could not fetch photos for experience:', err2);
          photos = [];
        }
      }
      
      // Fetch host info if available (extract host_id from experience if available)
      let host: UserResponse | null = null;
      try {
        const hostId = (experience as any).host_id;
        if (hostId) {
          const hostResponse = await api.get(`/users/${hostId}/profile`);
          host = hostResponse.data;
        }
      } catch (err) {
        console.warn('Could not fetch host info:', err);
        // Continue without host info
      }
      
      setPreviewPhotos(photos);
      setPreviewHost(host);
      setPreviewExperience(experience);
      // Keep setSelectedExperience for backward compatibility with existing modal
      setSelectedExperience(experience);
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to fetch experience details');
      setError(err instanceof Error ? err.message : 'Failed to fetch experience details');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewEventRun = async (eventRunId: string) => {
    try {
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const response = await api.get(`/admin/event-runs/${eventRunId}`);
      const data = response.data;
      setSelectedEventRun(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event run details');
    }
  };

  const handleApproveExperience = async (experienceId: string) => {
    try {
      setReviewing(true);
      setReviewingApplicationId(experienceId); // Reusing this state for experiences
      
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const reviewData = {
        decision: 'approved',
        admin_feedback: 'Experience approved - looks great!',
        structured_feedback: {
          decision_reason: 'Well-structured experience with clear details and good value for travelers',
          content_quality_notes: 'Content is engaging and informative',
          next_steps: 'Your experience is now live! You can create event runs to start accepting bookings.'
        }
      };
      
      await api.post(`/admin/experiences/${experienceId}/review`, reviewData);
      
      setSelectedExperience(null);
      fetchExperiences(); // Refresh the list
      
    } catch (err: unknown) {
      console.error('Error approving experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve experience');
    } finally {
      setReviewing(false);
      setReviewingApplicationId(null);
    }
  };

  const handleRejectExperience = async (experienceId: string) => {
    if (!rejectionFeedback.trim()) {
      setError('Please provide feedback for rejection');
      return;
    }

    try {
      setReviewing(true);
      setReviewingApplicationId(experienceId);
      
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const reviewData = {
        decision: 'rejected',
        admin_feedback: rejectionFeedback,
        structured_feedback: {
          decision_reason: rejectionFeedback,
          improvement_suggestions: ['Please address the feedback provided', 'Consider updating the experience with more details'],
          next_steps: 'Please revise your experience based on the feedback and resubmit for review.'
        }
      };
      
      await api.post(`/admin/experiences/${experienceId}/review`, reviewData);
      
      setSelectedExperience(null);
      setShowRejectForm(false);
      setRejectionFeedback('');
      fetchExperiences(); // Refresh the list
      
    } catch (err: unknown) {
      console.error('Error rejecting experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject experience');
    } finally {
      setReviewing(false);
      setReviewingApplicationId(null);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      setReviewing(true);
      setReviewingApplicationId(applicationId);
      
      const reviewData: HostApplicationReview = {
        decision: 'approved',
        admin_notes: 'Application approved - welcome to Mayhouse!',
        feedback: {
          decision_reason: 'Strong application with good local expertise and clear communication',
          strengths: ['Good communication', 'Local knowledge', 'Relevant experience'],
          next_steps: 'You can now create experiences! Check your email for host onboarding instructions.'
        }
      };

      await reviewHostApplication(applicationId, reviewData);
      setSelectedApplication(null);
      fetchApplications(); // Refresh the list
      
    } catch (err: unknown) {
      console.error('Error reviewing application:', err);
      setError(err instanceof Error ? err.message : 'Failed to review application');
    } finally {
      setReviewing(false);
      setReviewingApplicationId(null);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!rejectionFeedback.trim()) {
      setError('Please provide feedback for rejection');
      return;
    }

    try {
      setReviewing(true);
      setReviewingApplicationId(applicationId);
      
      const reviewData: HostApplicationReview = {
        decision: 'rejected',
        admin_notes: rejectionFeedback,
        feedback: {
          decision_reason: rejectionFeedback,
          improvements: ['Please address the feedback provided', 'Consider reapplying after improvements'],
          next_steps: 'You may resubmit your application after addressing the concerns mentioned above.'
        }
      };

      await reviewHostApplication(applicationId, reviewData);
      setSelectedApplication(null);
      setShowRejectForm(false);
      setRejectionFeedback('');
      fetchApplications(); // Refresh the list
      
    } catch (err: unknown) {
      console.error('Error reviewing application:', err);
      setError(err instanceof Error ? err.message : 'Failed to review application');
    } finally {
      setReviewing(false);
      setReviewingApplicationId(null);
    }
  };

  const openRejectForm = (applicationId: string) => {
    setReviewingApplicationId(applicationId);
    setShowRejectForm(true);
    setRejectionFeedback('');
  };

  const cancelReject = () => {
    setShowRejectForm(false);
    setRejectionFeedback('');
    setReviewingApplicationId(null);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await AuthAPI.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventRunStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'low_seats': return 'bg-yellow-100 text-yellow-800';
      case 'sold_out': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminOnlyRoute skeleton={<ModeratorSkeleton />}>
      <style jsx global>{`
        .force-word-break {
          word-break: break-all;
          overflow-wrap: anywhere;
          hyphens: auto;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-black">Moderator Dashboard</h1>
                <p className="text-black">
                  {activeTab === 'applications' ? 'Manage host applications' : 
                   activeTab === 'experiences' ? 'Manage experiences' : 
                   'Manage event runs and bookings'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Host Applications
                {applications.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {applications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('experiences')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'experiences'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Experience Applications
                {experiences.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {experiences.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('eventruns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'eventruns'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                EventRun Schedules
                {eventRuns.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {eventRuns.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            {error.includes('Admin access required') && (
              <div className="mt-2 text-sm text-red-700">
                Connect your wallet to access moderator features
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {activeTab === 'applications' ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Filter Applications</h2>
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as 'all' | 'pending' | 'approved' | 'rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === 'all' && ` (${applications.length})`}
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === 'experiences' ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Filter Experience Applications</h2>
            <div className="flex space-x-2">
              {[['all', 'All'], ['submitted', 'Submitted'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => setExperienceFilter(status as 'all' | 'submitted' | 'approved' | 'rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    experienceFilter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {status === 'all' && ` (${experiences.length})`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Filter EventRun Schedules</h2>
            <div className="flex space-x-2">
              {[['all', 'All'], ['scheduled', 'Scheduled'], ['low_seats', 'Low Seats'], ['sold_out', 'Sold Out'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => setEventRunFilter(status as 'all' | 'scheduled' | 'low_seats' | 'sold_out' | 'completed' | 'cancelled')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    eventRunFilter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {status === 'all' && ` (${eventRuns.length})`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              {activeTab === 'applications' ? 'Host Applications' : 
               activeTab === 'experiences' ? 'Experience Applications' : 
               'EventRun Schedules'}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-black">Loading {activeTab}...</p>
            </div>
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <div className="p-8 text-center text-black">
                No applications found for &quot;{filter}&quot; status.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-gray-50 overflow-hidden">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-black break-words force-word-break">{app.user_name}</h3>
                            <p className="text-black break-words force-word-break">{app.user_email}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-black space-y-1 min-w-0">
                          <div className="flex items-center space-x-4 flex-wrap">
                            <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                            {app.reviewed_at && (
                              <span>Reviewed: {new Date(app.reviewed_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="break-words overflow-wrap-anywhere force-word-break">Domains: {app.experience_domains.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewApplication(app.id)}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 whitespace-nowrap"
                        >
                          View Details
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveApplication(app.id)}
                              disabled={reviewing && reviewingApplicationId === app.id}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400 whitespace-nowrap"
                            >
                              {reviewing && reviewingApplicationId === app.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => openRejectForm(app.id)}
                              disabled={reviewing}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'experiences' ? (
            experiences.length === 0 ? (
              <div className="p-8 text-center text-black">
                No experiences found for &quot;{experienceFilter}&quot; status.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {experiences.map((exp) => (
                  <div key={exp.id} className="p-6 hover:bg-gray-50 overflow-hidden">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-black break-words overflow-wrap-anywhere force-word-break">{exp.title}</h3>
                            <p className="text-black text-sm break-words overflow-wrap-anywhere force-word-break mt-1">{exp.promise}</p>
                            <p className="text-black text-sm mt-1 break-words overflow-wrap-anywhere force-word-break">Domain: {exp.experience_domain} • Duration: {exp.duration_minutes}min • ₹{exp.price_inr}/person</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(exp.status)}`}>
                            {exp.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-black space-y-1 min-w-0">
                          <div className="flex items-center space-x-4 flex-wrap">
                            <span>Created: {new Date(exp.created_at).toLocaleDateString()}</span>
                            {exp.updated_at && (
                              <span>Updated: {new Date(exp.updated_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="break-words overflow-wrap-anywhere force-word-break">Location: {exp.neighborhood}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewExperience(exp.id)}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 whitespace-nowrap"
                        >
                          View Details
                        </button>
                        {exp.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleApproveExperience(exp.id)}
                              disabled={reviewing && reviewingApplicationId === exp.id}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400 whitespace-nowrap"
                            >
                              {reviewing && reviewingApplicationId === exp.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => openRejectForm(exp.id)}
                              disabled={reviewing}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            eventRuns.length === 0 ? (
              <div className="p-8 text-center text-black">
                No event runs found for &quot;{eventRunFilter}&quot; status.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {eventRuns.map((run) => (
                  <div key={run.id} className="p-6 hover:bg-gray-50 overflow-hidden">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-black break-words overflow-wrap-anywhere force-word-break">{run.experience_title}</h3>
                            <p className="text-black text-sm break-words overflow-wrap-anywhere force-word-break mt-1">Host: {run.host_name}</p>
                            <p className="text-black text-sm mt-1 break-words overflow-wrap-anywhere force-word-break">
                              {new Date(run.start_datetime).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {' - '}
                              {new Date(run.end_datetime).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getEventRunStatusColor(run.status)}`}>
                            {run.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-black space-y-1 min-w-0">
                          <div className="flex items-center space-x-4 flex-wrap">
                            <span>Capacity: {run.current_bookings || 0}/{run.max_capacity}</span>
                            <span>₹{run.pricing_inr || run.experience_price_inr}/person</span>
                            {run.location && <span>Location: {run.location}</span>}
                          </div>
                          <div className="min-w-0">
                            <span className="break-words overflow-wrap-anywhere force-word-break">Created: {new Date(run.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewEventRun(run.id)}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 whitespace-nowrap"
                        >
                          View Details
                        </button>
                        {run.bookings && run.bookings.length > 0 && (
                          <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg whitespace-nowrap">
                            {run.bookings.length} Booking{run.bookings.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black">Application Details</h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-black">Applicant Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-black">
                      <div>
                        <strong>User ID:</strong> {selectedApplication.user_id}
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedApplication.status)}`}>
                          {selectedApplication.status}
                        </span>
                      </div>
                      <div>
                        <strong>Applied:</strong> {new Date(selectedApplication.applied_at).toLocaleDateString()}
                      </div>
                      {selectedApplication.reviewed_at && (
                        <div>
                          <strong>Reviewed:</strong> {new Date(selectedApplication.reviewed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {'application_data' in selectedApplication && (
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Application Data</h4>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-black overflow-hidden">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(selectedApplication.application_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {'admin_notes' in selectedApplication && selectedApplication.admin_notes && (
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Admin Notes</h4>
                      <p className="text-black bg-gray-50 p-3 rounded break-words whitespace-pre-wrap">{selectedApplication.admin_notes}</p>
                    </div>
                  )}

                  {'admin_feedback' in selectedApplication && selectedApplication.admin_feedback && (
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Admin Feedback</h4>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-black overflow-hidden">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(selectedApplication.admin_feedback, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Review Actions in Detail View */}
                  {selectedApplication.status === 'pending' && (
                    <div className="border-t pt-6">
                      <h4 className="font-semibold mb-4 text-black">Review Actions</h4>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleApproveApplication(selectedApplication.id)}
                          disabled={reviewing && reviewingApplicationId === selectedApplication.id}
                          className="px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400 font-medium"
                        >
                          {reviewing && reviewingApplicationId === selectedApplication.id ? 'Approving...' : 'Approve Application'}
                        </button>
                        <button
                          onClick={() => openRejectForm(selectedApplication.id)}
                          disabled={reviewing}
                          className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 font-medium"
                        >
                          Reject Application
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Experience Preview Modal */}
        {previewExperience && (
          <ExperiencePreviewModal
            experience={normalizeModeratorExperience(previewExperience, previewPhotos)}
            photos={convertPhotosToArray(previewPhotos)}
            host={previewHost}
            onClose={() => {
              setPreviewExperience(null);
              setPreviewPhotos([]);
              setPreviewHost(null);
              setPreviewError(null);
              setSelectedExperience(null); // Also clear old modal state
            }}
            mode="saved"
            showStatus={true}
            status={previewExperience.status}
            isLoading={loadingPreview}
            error={previewError}
          />
        )}

        {/* Event Run Details Modal */}
        {selectedEventRun && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black">Event Run Details</h3>
                <button
                  onClick={() => setSelectedEventRun(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-black">Event Run Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-black">
                      <div>
                        <strong>Experience:</strong> {selectedEventRun.experience_title}
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getEventRunStatusColor(selectedEventRun.status)}`}>
                          {selectedEventRun.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <strong>Host:</strong> {selectedEventRun.host_name}
                      </div>
                      <div>
                        <strong>Start:</strong> {new Date(selectedEventRun.start_datetime).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>
                        <strong>End:</strong> {new Date(selectedEventRun.end_datetime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>
                        <strong>Duration:</strong> {selectedEventRun.duration_minutes} minutes
                      </div>
                      <div>
                        <strong>Capacity:</strong> {selectedEventRun.current_bookings || 0} / {selectedEventRun.max_capacity} people
                      </div>
                      <div>
                        <strong>Price:</strong> ₹{selectedEventRun.pricing_inr || selectedEventRun.experience_price_inr} per person
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-black">Location Details</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-black text-sm space-y-2">
                      <div>
                        <strong className="block mb-1">Neighborhood:</strong>
                        <p className="break-words">{selectedEventRun.location || selectedEventRun.experience_neighborhood}</p>
                      </div>
                      {selectedEventRun.meeting_landmark && (
                        <div>
                          <strong className="block mb-1">Meeting Landmark:</strong>
                          <p className="break-words">{selectedEventRun.meeting_landmark}</p>
                        </div>
                      )}
                      {selectedEventRun.host_meeting_instructions && (
                        <div>
                          <strong className="block mb-1">Host Meeting Instructions:</strong>
                          <p className="break-words whitespace-pre-wrap">{selectedEventRun.host_meeting_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedEventRun.detailed_bookings && selectedEventRun.detailed_bookings.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Bookings ({selectedEventRun.detailed_bookings.length})</h4>
                      <div className="bg-gray-50 p-4 rounded-lg text-black text-sm">
                        <div className="space-y-4">
                          {selectedEventRun.detailed_bookings.map((booking: unknown, index: number) => {
                            const b = booking as {
                              id?: string;
                              traveler_name: string;
                              booking_status: string;
                              traveler_email: string;
                              traveler_phone?: string;
                              traveler_count: number;
                              booking_type: string;
                              total_cost: number;
                              booked_at: string;
                              traveler_details?: unknown;
                              special_requests?: string;
                              host_notes?: string;
                            };
                            return (
                            <div key={b.id || index} className="border border-gray-300 rounded-lg p-4 bg-white">
                              {/* Main booking info */}
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <strong>Traveler Name:</strong><br/>
                                  <span className="text-blue-600">{b.traveler_name}</span>
                                </div>
                                <div>
                                  <strong>Booking Status:</strong><br/>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    b.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    b.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    b.booking_status === 'experience_completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {b.booking_status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <strong>Contact Email:</strong><br/>
                                  <a href={`mailto:${b.traveler_email}`} className="text-blue-600 hover:underline">
                                    {b.traveler_email}
                                  </a>
                                </div>
                                <div>
                                  <strong>Phone Number:</strong><br/>
                                  {b.traveler_phone ? (
                                    <a href={`tel:${b.traveler_phone}`} className="text-blue-600 hover:underline">
                                      {b.traveler_phone}
                                    </a>
                                  ) : (
                                    <span className="text-gray-500">Not provided</span>
                                  )}
                                </div>
                                <div>
                                  <strong>Group Size:</strong><br/>
                                  <span>{b.traveler_count} {b.traveler_count === 1 ? 'person' : 'people'}</span>
                                  <span className="text-gray-500 ml-2">({b.booking_type.replace('_', ' ')})</span>
                                </div>
                                <div>
                                  <strong>Total Cost:</strong><br/>
                                  <span className="text-green-600 font-semibold">₹{b.total_cost}</span>
                                </div>
                              </div>
                              
                              {/* Additional details */}
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <strong>Booked On:</strong><br/>
                                  <span>{new Date(b.booked_at).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                                
                                {b.traveler_details && typeof b.traveler_details === 'object' ? (
                                  <div>
                                    <strong>Traveler Details:</strong><br/>
                                    <div className="bg-gray-100 p-2 rounded mt-1">
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(b.traveler_details as Record<string, unknown>, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                ) : null}
                                
                                {b.special_requests && (
                                  <div>
                                    <strong>Special Requests:</strong><br/>
                                    <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mt-1">
                                      <span className="text-yellow-800">{b.special_requests}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {b.host_notes && (
                                  <div>
                                    <strong>Host Check-in Notes:</strong><br/>
                                    <div className="bg-blue-50 border border-blue-200 p-2 rounded mt-1">
                                      <span className="text-blue-800">{b.host_notes}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Booking Summary */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="font-semibold text-blue-800 mb-2">Booking Summary</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                          <div>
                            <strong>Total Bookings:</strong> {selectedEventRun.detailed_bookings.length}
                          </div>
                          <div>
                            <strong>Total Travelers:</strong> {selectedEventRun.detailed_bookings.reduce((sum: number, b: unknown) => sum + (b as { traveler_count: number }).traveler_count, 0)}
                          </div>
                          <div>
                            <strong>Available Spots:</strong> {selectedEventRun.max_capacity - selectedEventRun.detailed_bookings.reduce((sum: number, b: unknown) => {
                              const booking = b as { booking_status: string; traveler_count: number };
                              return sum + (booking.booking_status === 'confirmed' || booking.booking_status === 'experience_completed' ? booking.traveler_count : 0);
                            }, 0)}
                          </div>
                          <div>
                            <strong>Total Revenue:</strong> ₹{selectedEventRun.detailed_bookings.reduce((sum: number, b: unknown) => {
                              const booking = b as { booking_status: string; total_cost: number };
                              return sum + (booking.booking_status === 'confirmed' || booking.booking_status === 'experience_completed' ? booking.total_cost : 0);
                            }, 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2 text-black">Metadata</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-black text-sm space-y-2">
                      <div>
                        <strong className="block mb-1">Created:</strong>
                        <p>{new Date(selectedEventRun.created_at).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      {selectedEventRun.updated_at && (
                        <div>
                          <strong className="block mb-1">Last Updated:</strong>
                          <p>{new Date(selectedEventRun.updated_at).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                      )}
                      <div>
                        <strong className="block mb-1">Group Pairing:</strong>
                        <p>{selectedEventRun.group_pairing_enabled ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Feedback Modal */}
        {showRejectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-red-600">
                  Reject {activeTab === 'applications' ? 'Application' : 'Experience'}
                </h3>
                <p className="text-black text-sm mt-1">
                  Please provide detailed feedback for the {activeTab === 'applications' ? 'applicant' : 'host'}
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">
                    Rejection Feedback *
                  </label>
                  <textarea
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                    placeholder={`Please explain why this ${activeTab === 'applications' ? 'application' : 'experience'} is being rejected and what can be improved for future submissions...`}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-black mt-1">
                    This feedback will be sent to help them improve their {activeTab === 'applications' ? 'application' : 'experience'}.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelReject}
                    disabled={reviewing}
                    className="px-4 py-2 text-black bg-gray-100 rounded-lg hover:bg-gray-200 disabled:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (reviewingApplicationId) {
                        if (activeTab === 'applications') {
                          handleRejectApplication(reviewingApplicationId);
                        } else {
                          handleRejectExperience(reviewingApplicationId);
                        }
                      }
                    }}
                    disabled={reviewing || !rejectionFeedback.trim()}
                    className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
                  >
                    {reviewing ? 'Rejecting...' : `Reject ${activeTab === 'applications' ? 'Application' : 'Experience'}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminOnlyRoute>
  );
};

export default ModeratorDashboard;
