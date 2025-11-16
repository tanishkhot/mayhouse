'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HostOnlyRoute } from '@/components/ProtectedRoute';
import { HostDashboardSkeleton } from '@/components/skeletons';
import EventRunsList from '@/components/EventRunsList';
import EventRunScheduler from '@/components/EventRunScheduler';
import { ExperienceCard } from '@/components/landing/ExperienceCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import DesignExperienceV2 from '@/components/design-experience-v2/DesignExperienceV2';

// Add custom styles for text clamping
const textClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = textClampStyles;
  document.head.appendChild(styleSheet);
}

interface Experience {
  id: string;
  title: string;
  promise: string;
  description: string;
  experience_domain: string;
  duration_minutes: number;
  price_inr: string;
  neighborhood: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
  cover_photo_url?: string;
  traveler_max_capacity?: number;
}

interface ExperiencePhoto {
  id: string;
  photo_url: string;
  is_cover_photo: boolean;
  display_order: number;
  caption?: string;
}

const HostDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'eventruns' | 'schedule'>('manage');
  useEffect(() => {
    try {
      console.log('[FLOW] HostDashboardContent mounted', { ts: new Date().toISOString() });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      console.log('[FLOW] HostDashboardContent activeTab', { activeTab, ts: new Date().toISOString() });
    } catch {}
  }, [activeTab]);
  
  // Event run management state
  const [eventRunRefreshTrigger, setEventRunRefreshTrigger] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);
  
  // Experience management state
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [experiencePhotos, setExperiencePhotos] = useState<Record<string, string>>({});
  
  // Experience creation state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitForReview, setSubmitForReview] = useState(false);
  const [isLoadingExperience, setIsLoadingExperience] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [experienceId, setExperienceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    theme: '',
    duration: 180,
    maxCapacity: 4,
    price: '',
    neighborhood: '',
    meetingPoint: '',
    requirements: '',
    whatToExpect: '',
    whatToKnow: '',
    whatToBring: '',
  });

  // Fetch cover photos for experiences
  const fetchExperiencePhotos = useCallback(async (experienceIds: string[]) => {
    const photosMap: Record<string, string> = {};
    
    for (const expId of experienceIds) {
      try {
        const photosResponse = await api.get(`/experiences/${expId}/photos`);
        const photos: ExperiencePhoto[] = photosResponse.data;
        const coverPhoto = photos.find(p => p.is_cover_photo) || photos[0];
        if (coverPhoto) {
          photosMap[expId] = coverPhoto.photo_url;
        }
      } catch (err) {
        // Photo not found or not uploaded yet - use placeholder
        console.log(`No photos found for experience ${expId}`);
      }
    }
    
    setExperiencePhotos(prev => ({ ...prev, ...photosMap }));
  }, []);

  // Define fetch functions before useEffect
  const fetchExperiences = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Always fetch all experiences first for counts
      const allResponse = await api.get('/experiences/my');
      const allData = allResponse.data;
      setAllExperiences(allData);
      
      // Fetch cover photos for all experiences
      fetchExperiencePhotos(allData.map((exp: Experience) => exp.id));
      
      // Filter experiences based on current filter
      if (filter === 'all') {
        setExperiences(allData);
      } else {
        const filteredData = allData.filter((exp: Experience) => exp.status === filter);
        setExperiences(filteredData);
      }
    } catch (err: unknown) {
      console.error('Error fetching experiences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch experiences');
    } finally {
      setLoading(false);
    }
  }, [filter, fetchExperiencePhotos]);

  const handleViewExperience = (experience: Experience) => {
    setSelectedExperience(experience);
  };

  const handleSubmitForReview = async (experienceId: string) => {
    try {
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Get current user to extract host_id
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;

      // Submit with correct payload structure matching backend schema
      await api.post(`/experiences/${experienceId}/submit`, {
        host_id: userData.id,
        submission_data: {
          submission_notes: 'Ready for admin review',
          ready_for_review: true
        }
      });

      // Refresh the experiences list
      fetchExperiences();
      setSelectedExperience(null);
      alert('Experience submitted for review successfully!');
    } catch (err: unknown) {
      console.error('Error submitting experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit experience');
      alert('Failed to submit experience. Please try again.');
    }
  };
  
  // Experience creation/editing functions
  const fetchExperienceData = useCallback(async (id: string) => {
    try {
      setIsLoadingExperience(true);
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await api.get(`/experiences/${id}`);
      const experienceData = response.data;
      console.log('Fetched experience data:', experienceData);
      
      // Map backend data to form fields
      setFormData({
        title: experienceData.title || '',
        description: experienceData.description || '',
        domain: experienceData.experience_domain || '',
        theme: experienceData.experience_theme || '',
        duration: experienceData.duration_minutes || 180,
        maxCapacity: experienceData.traveler_max_capacity || 4,
        price: experienceData.price_inr?.toString() || '',
        neighborhood: experienceData.neighborhood || '',
        meetingPoint: experienceData.meeting_point_details || '',
        requirements: Array.isArray(experienceData.accessibility_notes) 
          ? experienceData.accessibility_notes.join(', ') 
          : experienceData.accessibility_notes || '',
        whatToExpect: experienceData.unique_element || '',
        whatToKnow: experienceData.experience_safety_guidelines || '',
        whatToBring: Array.isArray(experienceData.traveler_should_bring) 
          ? experienceData.traveler_should_bring.join(', ') 
          : experienceData.traveler_should_bring || '',
      });

    } catch (error) {
      console.error('Error fetching experience:', error);
      setError('Network error while loading experience. Please try again.');
    } finally {
      setIsLoadingExperience(false);
    }
  }, [setFormData, setIsLoadingExperience, setError]);

  // Now add useEffects after functions are defined
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchExperiences();
    }
  }, [filter, activeTab, fetchExperiences]);
  
  // Check if we're editing an experience from URL params
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setExperienceId(editId);
      setActiveTab('create'); // Switch to create tab for editing
      fetchExperienceData(editId);
    }
  }, [searchParams, fetchExperienceData]);

  // Helper function to get count for each status
  const getStatusCount = (status: string) => {
    if (status === 'all') return allExperiences.length;
    return allExperiences.filter(exp => exp.status === status).length;
  };
  
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  
  // Form validation rules
  const validationRules = {
    title: { minLength: 10, required: true, label: 'Title' },
    description: { minLength: 100, required: true, label: 'Description' },
    whatToExpect: { minLength: 50, required: true, label: 'What to Expect' },
    domain: { required: true, label: 'Category' },
    price: { required: true, label: 'Price', min: 1 },
    neighborhood: { required: true, label: 'Neighborhood' },
    meetingPoint: { required: true, label: 'Meeting Point' }
  };

  // Validate single field
  const validateField = (field: string, value: unknown) => {
    const rule = validationRules[field as keyof typeof validationRules];
    if (!rule) return null;

    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${rule.label} is required`;
    }

    if ('minLength' in rule && rule.minLength && value && typeof value === 'string' && value.length < rule.minLength) {
      return `${rule.label} must be at least ${rule.minLength} characters`;
    }

    if ('min' in rule && rule.min && value && typeof value === 'string' && parseFloat(value) < rule.min) {
      return `${rule.label} must be at least ${rule.min}`;
    }

    return null;
  };

  // Update form data with validation
  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const error = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Get field CSS classes based on validation state
  const getFieldClasses = (field: string) => {
    const hasError = (fieldErrors as Record<string, string>)[field];
    const baseClasses = "w-full border rounded-lg px-3 py-2 text-black focus:ring-2";
    
    if (hasError) {
      return `${baseClasses} border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50`;
    } else {
      return `${baseClasses} border-gray-300 focus:ring-red-500 focus:border-red-500`;
    }
  };

  // Validate all fields
  const validateAllFields = () => {
    const errors = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, (formData as Record<string, unknown>)[field]);
      if (error) {
        (errors as Record<string, string>)[field] = error;
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return !hasErrors;
  };
  
  const handleFormSubmit = async () => {
    // Validate all fields
    if (!validateAllFields()) {
      const errorMessages = Object.values(fieldErrors).filter(Boolean);
      setError('Please fix validation errors: ' + errorMessages.join(', '));
      return;
    }

    const actionText = isEditMode ? 'updating' : 'creating';
    console.log(`📝 FORM: Starting experience ${actionText}...`);
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Create the experience payload matching backend schema
      const experienceData = {
        title: formData.title,
        promise: formData.description.substring(0, 200),
        description: formData.description,
        unique_element: formData.whatToExpect || `This ${formData.domain} experience offers authentic local insights and memorable moments.`,
        host_story: `As a passionate local guide, I created this ${formData.domain} experience to share the authentic side of Mumbai with travelers.`,
        experience_domain: formData.domain,
        experience_theme: formData.theme,
        neighborhood: formData.neighborhood,
        meeting_landmark: formData.meetingPoint.split(',')[0] || formData.meetingPoint,
        meeting_point_details: formData.meetingPoint,
        duration_minutes: formData.duration,
        traveler_max_capacity: formData.maxCapacity,
        price_inr: parseFloat(formData.price),
        inclusions: ['Professional local guide', 'All activities mentioned in description'],
        traveler_should_bring: formData.whatToBring ? [formData.whatToBring] : ['Comfortable walking shoes', 'Camera (optional)'],
        accessibility_notes: formData.requirements ? [formData.requirements] : [],
        experience_safety_guidelines: formData.whatToKnow
      };
      
      // Determine API endpoint and method
      const apiUrl = isEditMode ? `/api/experiences/${experienceId}` : '/api/experiences';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(experienceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Experience ${isEditMode ? 'updated' : 'created'} successfully:`, result);
        
        // Reset form and switch back to manage tab
        setFormData({
          title: '', description: '', domain: '', theme: '', duration: 180,
          maxCapacity: 4, price: '', neighborhood: '', meetingPoint: '',
          requirements: '', whatToExpect: '', whatToKnow: '', whatToBring: ''
        });
        setStep(1);
        setIsEditMode(false);
        setExperienceId(null);
        setFieldErrors({});
        setSubmitForReview(false);
        
        // Refresh experiences and switch to manage tab
        fetchExperiences();
        setActiveTab('manage');
        
        if (isEditMode) {
          setError(''); // Clear any previous errors
          alert('Experience updated successfully!');
        } else if (submitForReview) {
          // Try to submit for review immediately
          try {
            const submitResponse = await fetch('/api/experiences/' + result.id + '/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ submission_notes: 'Ready for admin review', ready_for_review: true })
            });
            
            if (submitResponse.ok) {
              alert('Experience created and submitted for review!');
            } else {
              alert('Experience created successfully, but failed to submit for review. You can submit it manually.');
            }
          } catch (error) {
            alert('Experience created successfully, but failed to submit for review. You can submit it manually.');
          }
        } else {
          alert('Experience created successfully and saved as a draft!');
        }
      } else {
        const error = await response.json();
        console.error('Error with experience:', error);
        
        if (response.status === 422 && error.detail && error.detail.field_errors) {
          setFieldErrors(error.detail.field_errors);
          const errorList = error.detail.errors || Object.values(error.detail.field_errors);
          setError(`Please fix validation errors: ${errorList.join(', ')}`);
        } else {
          const errorMessage = error.detail?.message || error.detail || error.message || 'Unknown error';
          setError(`Failed to ${isEditMode ? 'update' : 'create'} experience: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'approved': return 'Approved';
      case 'rejected': return 'Needs Revision';
      default: return status;
    }
  };

  const resetFormData = () => {
    setIsEditMode(false);
    setExperienceId(null);
    setFormData({
      title: '', description: '', domain: '', theme: '', duration: 180,
      maxCapacity: 4, price: '', neighborhood: '', meetingPoint: '',
      requirements: '', whatToExpect: '', whatToKnow: '', whatToBring: ''
    });
    setStep(1);
    setFieldErrors({});
    setSubmitForReview(false);
  };

  return (
    <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              Welcome back, host.
            </h1>
            <p className="mt-4 max-w-2xl text-base lg:text-lg text-white/90">
              Shape new experiences, track reviews, and keep your event runs fresh. Everything you need to curate unforgettable moments lives here.
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-6 lg:px-8 -mt-8 pb-10">
          <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
            <div className="px-6 pt-6">
              <nav className="flex flex-wrap gap-2" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    activeTab === 'manage'
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  My Experiences
                </button>
                <button
                  onClick={() => {
                    resetFormData();
                    setActiveTab('create');
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    activeTab === 'create'
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {isEditMode ? 'Edit Experience' : 'Create Experience'}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('eventruns');
                    setShowScheduler(false);
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    activeTab === 'eventruns' || activeTab === 'schedule'
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  Event Runs
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 lg:p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                <p className="text-sm text-muted-foreground">
                  Need a quick end-to-end check? Jump straight to the scheduler to spin up a test run.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('eventruns');
                      setShowScheduler(true);
                    }}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow transition"
                  >
                    Test schedule run
                  </button>
                </div>
              </div>

              {activeTab === 'manage' && (
                <div>
                  {/* Experience Management */}
                  <div className="mb-8">
                    <h2 className="text-base font-semibold text-foreground mb-3 uppercase tracking-wide">Filter</h2>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['all', 'All'],
                        ['draft', 'Drafts'],
                        ['submitted', 'Submitted'],
                        ['approved', 'Approved'],
                        ['rejected', 'Needs Revision']
                      ].map(([status, label]) => (
                        <button
                          key={status}
                          onClick={() => setFilter(status as 'all' | 'draft' | 'submitted' | 'approved' | 'rejected')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === status
                              ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70'
                          }`}
                        >
                          {label} ({getStatusCount(status)})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience Cards Grid */}
                  <div className="mb-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-muted-foreground">Your work</p>
                        <h2 className="text-2xl font-semibold text-foreground">Experiences you&apos;re crafting</h2>
                      </div>
                      <button
                        onClick={() => {
                          resetFormData();
                          setActiveTab('create');
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-orange-500/20 transition hover:shadow-xl"
                      >
                        <span className="text-lg leading-none">＋</span> New experience
                      </button>
                    </div>
                    {loading ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <Card key={i} className="overflow-hidden !p-0 !shadow-none">
                            <Skeleton className="w-full aspect-[4/3]" />
                            <div className="p-4 space-y-4">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : experiences.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {experiences.map((exp) => {
                          const formatDuration = (minutes: number) => {
                            if (minutes < 60) return `${minutes} min`;
                            const hours = Math.floor(minutes / 60);
                            const remainingMinutes = minutes % 60;
                            if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
                            return `${hours}h ${remainingMinutes}m`;
                          };

                          // Use placeholder image if no cover photo
                          const placeholderImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBleHBlcmllbmNlfGVufDF8fHx8MTc2MjM2MTU3MHww&ixlib=rb-4.1.0&q=80&w=1080';
                          
                          return (
                            <ExperienceCard
                              key={exp.id}
                              id={exp.id}
                              title={exp.title}
                              host={{
                                name: 'You', // TODO: Get actual host name from user profile
                                verified: true,
                              }}
                              image={experiencePhotos[exp.id] || placeholderImage}
                              category={exp.experience_domain}
                              duration={formatDuration(exp.duration_minutes)}
                              groupSize={`${exp.traveler_max_capacity || 4} people`}
                              price={parseFloat(exp.price_inr)}
                              priceLocale="en-IN"
                              currencySymbol="₹"
                              rating={4.5} // TODO: Calculate actual rating from reviews
                              reviews={0} // TODO: Get actual review count
                              location={exp.neighborhood || 'Mumbai'}
                              tags={exp.status === 'approved' ? ['Approved'] : exp.status === 'draft' ? ['Draft'] : []}
                              onSelect={(id) => handleViewExperience(experiences.find(e => e.id === id)!)}
                              ctaLabel="View details"
                              onCtaClick={() => handleViewExperience(exp)}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  {/* Experiences List */}
                  <div className="rounded-2xl border border-border bg-muted/30">
                    <div className="px-6 py-4 border-b border-border/80 bg-white rounded-t-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">Deep dive</p>
                          <h2 className="text-lg font-semibold text-foreground">Operational view</h2>
                        </div>
                        <button
                          onClick={() => {
                            resetFormData();
                            setActiveTab('create');
                          }}
                          className="px-4 py-2 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors text-sm font-medium"
                        >
                          New experience
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-8 text-center bg-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-foreground">Loading experiences...</p>
                      </div>
                    ) : experiences.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-b-2xl">
                        <div className="text-muted-foreground mb-4">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No experiences found</h3>
                        <p className="text-muted-foreground mb-4">
                          {filter === 'all' 
                            ? "You haven't created any experiences yet."
                            : `No experiences found with "${filter}" status.`
                          }
                        </p>
                        <button
                          onClick={() => {
                            resetFormData();
                            setActiveTab('create');
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-full hover:from-orange-600 hover:to-rose-700 transition-colors"
                        >
                          Create Your First Experience
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border bg-white rounded-b-2xl">
                        {experiences.map((exp) => (
                          <div key={exp.id} className="p-6 hover:bg-muted/40 transition">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-foreground truncate">{exp.title}</h3>
                                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2 break-words">{exp.promise}</p>
                                    <p className="text-muted-foreground text-sm mt-1 break-words">
                                      Domain: {exp.experience_domain} • Duration: {exp.duration_minutes}min • ₹{exp.price_inr}/person
                                    </p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${getStatusColor(exp.status)}`}>
                                    {getStatusLabel(exp.status)}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                  <span>Created: {new Date(exp.created_at).toLocaleDateString()}</span>
                                  <span>Updated: {new Date(exp.updated_at).toLocaleDateString()}</span>
                                  <span>Location: {exp.neighborhood}</span>
                                </div>
                                {exp.admin_feedback && (
                                  <div className="mt-3">
                                    <p className="text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded border border-yellow-200 break-words">
                                      <strong>Admin Feedback:</strong> {exp.admin_feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col space-y-2 flex-shrink-0">
                                <button
                                  onClick={() => handleViewExperience(exp)}
                                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 whitespace-nowrap transition"
                                >
                                  View Details
                                </button>
                                {exp.status === 'draft' && (
                                  <button
                                    onClick={() => handleSubmitForReview(exp.id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-full hover:bg-green-600 whitespace-nowrap transition"
                                  >
                                    Submit for Review
                                  </button>
                                )}
                                {exp.status === 'rejected' && (
                                  <button
                                    onClick={() => {
                                      setIsEditMode(true);
                                      setExperienceId(exp.id);
                                      setActiveTab('create');
                                      fetchExperienceData(exp.id);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-full hover:bg-orange-600 whitespace-nowrap transition"
                                  >
                                    Edit & Resubmit
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'create' && (
                <div>
                  <DesignExperienceV2 />
                </div>
              )}
              
              {/* Event Runs Tab */}
              {activeTab === 'eventruns' && (
                <div>
                  {showScheduler ? (
                    <EventRunScheduler
                      onSuccess={() => {
                        setShowScheduler(false);
                        setEventRunRefreshTrigger(prev => prev + 1);
                      }}
                      onCancel={() => setShowScheduler(false)}
                    />
                  ) : (
                    <EventRunsList
                      onScheduleNew={() => setShowScheduler(true)}
                      onEditEventRun={(eventRunId, experienceId) => {
                        // TODO: Implement edit functionality
                        console.log('Edit event run:', eventRunId, experienceId);
                      }}
                      refreshTrigger={eventRunRefreshTrigger}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Experience Details Modal */}
        {selectedExperience && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black">Experience Details</h3>
                <button
                  onClick={() => setSelectedExperience(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-black">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-black">
                      <div><strong>Title:</strong> {selectedExperience.title}</div>
                      <div>
                        <strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedExperience.status)}`}>
                          {getStatusLabel(selectedExperience.status)}
                        </span>
                      </div>
                      <div><strong>Domain:</strong> {selectedExperience.experience_domain}</div>
                      <div><strong>Duration:</strong> {selectedExperience.duration_minutes} minutes</div>
                      <div><strong>Price:</strong> ₹{selectedExperience.price_inr} per person</div>
                      <div><strong>Location:</strong> {selectedExperience.neighborhood}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-black">Description</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-black text-sm">
                      <p><strong>Promise:</strong> {selectedExperience.promise}</p>
                      <p className="mt-2"><strong>Full Description:</strong> {selectedExperience.description}</p>
                    </div>
                  </div>

                  {selectedExperience.admin_feedback && (
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Admin Feedback</h4>
                      <p className="text-black bg-yellow-50 p-3 rounded border border-yellow-200">
                        {selectedExperience.admin_feedback}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    {selectedExperience.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitForReview(selectedExperience.id)}
                        className="px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
                      >
                        Submit for Review
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedExperience(null)}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

const HostDashboard = () => {
  return (
    <HostOnlyRoute skeleton={<HostDashboardSkeleton />}>
      <Suspense fallback={<HostDashboardSkeleton />}>
        <HostDashboardContent />
      </Suspense>
    </HostOnlyRoute>
  );
};

export default HostDashboard;