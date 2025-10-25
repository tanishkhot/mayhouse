'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedRoute } from '@/components/ProtectedRoute';
import EventRunsList from '@/components/EventRunsList';
import EventRunScheduler from '@/components/EventRunScheduler';
import { api } from '@/lib/api';

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
}

const HostDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'eventruns' | 'schedule'>('manage');
  
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
  }, [filter, setAllExperiences, setExperiences, setLoading, setError]);

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

      await api.post(`/experiences/${experienceId}/submit`, {
        submission_notes: 'Ready for admin review',
        ready_for_review: true
      });

      // Refresh the experiences list
      fetchExperiences();
      setSelectedExperience(null);
    } catch (err: unknown) {
      console.error('Error submitting experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit experience');
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
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-black">Host Dashboard</h1>
                <p className="text-black">Manage and create your experiences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'manage'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Experiences
                </button>
                <button
                  onClick={() => {
                    resetFormData();
                    setActiveTab('create');
                  }}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'create'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {isEditMode ? 'Edit Experience' : 'Create Experience'}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('eventruns');
                    setShowScheduler(false);
                  }}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'eventruns' || activeTab === 'schedule'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Event Runs
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {activeTab === 'manage' && (
                <div>
                  {/* Experience Management */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-black">Filter Experiences</h2>
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
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-black hover:bg-gray-200'
                          }`}
                        >
                          {label} ({getStatusCount(status)})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experiences List */}
                  <div className="bg-gray-50 rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-black">Your Experiences</h2>
                        <button
                          onClick={() => {
                            resetFormData();
                            setActiveTab('create');
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          + Create Experience
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-8 text-center bg-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-black">Loading experiences...</p>
                      </div>
                    ) : experiences.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-b-lg">
                        <div className="text-gray-500 mb-4">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-black mb-2">No experiences found</h3>
                        <p className="text-gray-600 mb-4">
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
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Create Your First Experience
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 bg-white rounded-b-lg">
                        {experiences.map((exp) => (
                          <div key={exp.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-black truncate">{exp.title}</h3>
                                    <p className="text-black text-sm mt-1 line-clamp-2 break-words">{exp.promise}</p>
                                    <p className="text-black text-sm mt-1 break-words">
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
                                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 whitespace-nowrap"
                                >
                                  View Details
                                </button>
                                {exp.status === 'draft' && (
                                  <button
                                    onClick={() => handleSubmitForReview(exp.id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 whitespace-nowrap"
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
                                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 whitespace-nowrap"
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
                  {/* Experience Creation Form */}
                  {isLoadingExperience ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                      <p className="text-black ml-4">Loading experience data...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-black mb-2">
                          {isEditMode ? 'Edit Your Experience' : 'Create New Experience'}
                        </h2>
                        <p className="text-gray-600">
                          {isEditMode ? 'Update your local adventure for travelers' : 'Design a unique local adventure for travelers'}
                        </p>
                      </div>

                      {/* Progress Indicator */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {[1, 2, 3].map((num) => (
                              <div
                                key={num}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  step >= num
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {num}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-black">Step {step} of 3</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Form Steps */}
                      <div className="bg-white rounded-lg border p-8">
                        {step === 1 && (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Basic Information</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Experience Title * (minimum 10 characters)
                              </label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => updateFormData('title', e.target.value)}
                                placeholder="e.g., Mumbai Street Food Adventure with Local Guide"
                                className={getFieldClasses('title')}
                                required
                              />
                              {(fieldErrors as Record<string, string>).title && (
                                <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).title}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">{formData.title.length}/10+ characters</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Description * (minimum 100 characters)
                              </label>
                              <textarea
                                value={formData.description}
                                onChange={(e) => updateFormData('description', e.target.value)}
                                placeholder="Describe what makes your experience unique and exciting..."
                                rows={4}
                                className={getFieldClasses('description')}
                                required
                              />
                              {(fieldErrors as Record<string, string>).description && (
                                <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).description}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">{formData.description.length}/100+ characters</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                  Category *
                                </label>
                                <select
                                  value={formData.domain}
                                  onChange={(e) => updateFormData('domain', e.target.value)}
                                  className={getFieldClasses('domain')}
                                  required
                                >
                                  <option value="">Select category</option>
                                  <option value="food">Food & Culinary</option>
                                  <option value="culture">Culture & Heritage</option>
                                  <option value="art">Art & Creativity</option>
                                  <option value="history">History & Stories</option>
                                  <option value="nature">Nature & Outdoors</option>
                                  <option value="nightlife">Nightlife & Entertainment</option>
                                </select>
                                {(fieldErrors as Record<string, string>).domain && (
                                  <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).domain}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                  Duration (minutes) *
                                </label>
                                <input
                                  type="number"
                                  value={formData.duration}
                                  onChange={(e) => updateFormData('duration', parseInt(e.target.value))}
                                  min="30"
                                  max="480"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {step === 2 && (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Experience Details</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                  Max Participants *
                                </label>
                                <input
                                  type="number"
                                  value={formData.maxCapacity}
                                  onChange={(e) => updateFormData('maxCapacity', parseInt(e.target.value))}
                                  min="1"
                                  max="4"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                  Price per Person (₹) *
                                </label>
                                <input
                                  type="number"
                                  value={formData.price}
                                  onChange={(e) => updateFormData('price', e.target.value)}
                                  placeholder="2000"
                                  className={getFieldClasses('price')}
                                  required
                                />
                                {(fieldErrors as Record<string, string>).price && (
                                  <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).price}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Neighborhood *
                              </label>
                              <input
                                type="text"
                                value={formData.neighborhood}
                                onChange={(e) => updateFormData('neighborhood', e.target.value)}
                                placeholder="e.g., Colaba, Bandra, Andheri"
                                className={getFieldClasses('neighborhood')}
                                required
                              />
                              {(fieldErrors as Record<string, string>).neighborhood && (
                                <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).neighborhood}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Meeting Point *
                              </label>
                              <input
                                type="text"
                                value={formData.meetingPoint}
                                onChange={(e) => updateFormData('meetingPoint', e.target.value)}
                                placeholder="e.g., Gateway of India, Main Entrance"
                                className={getFieldClasses('meetingPoint')}
                                required
                              />
                              {(fieldErrors as Record<string, string>).meetingPoint && (
                                <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).meetingPoint}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                What to Expect * (minimum 50 characters)
                              </label>
                              <textarea
                                value={formData.whatToExpect}
                                onChange={(e) => updateFormData('whatToExpect', e.target.value)}
                                placeholder="Describe the unique highlights and special moments..."
                                rows={3}
                                className={getFieldClasses('whatToExpect')}
                                required
                              />
                              {(fieldErrors as Record<string, string>).whatToExpect && (
                                <p className="text-sm text-red-500 mt-1">{(fieldErrors as Record<string, string>).whatToExpect}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">{(formData.whatToExpect || '').length}/50+ characters</p>
                            </div>
                          </div>
                        )}

                        {step === 3 && (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-black mb-6">Additional Information</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Requirements & Prerequisites
                              </label>
                              <textarea
                                value={formData.requirements}
                                onChange={(e) => updateFormData('requirements', e.target.value)}
                                placeholder="Any age restrictions, fitness requirements, etc..."
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                What to Bring
                              </label>
                              <textarea
                                value={formData.whatToBring}
                                onChange={(e) => updateFormData('whatToBring', e.target.value)}
                                placeholder="Items participants should bring..."
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-black mb-2">
                                Good to Know
                              </label>
                              <textarea
                                value={formData.whatToKnow}
                                onChange={(e) => updateFormData('whatToKnow', e.target.value)}
                                placeholder="Important information, cancellation policy..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>

                            {/* Submit for Review Option - Only show for new experiences */}
                            {!isEditMode && (
                              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id="submitForReview"
                                    checked={submitForReview}
                                    onChange={(e) => setSubmitForReview(e.target.checked)}
                                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                                  />
                                  <label htmlFor="submitForReview" className="text-sm font-medium text-blue-800">
                                    Submit for admin review immediately after creation
                                  </label>
                                </div>
                                <p className="text-xs text-blue-700 mt-2 ml-7">
                                  If checked, your experience will be automatically submitted for admin approval. Otherwise, it will be saved as a draft.
                                </p>
                              </div>
                            )}
                            
                            {/* Edit mode info */}
                            {isEditMode && (
                              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                                <div className="flex items-center space-x-3">
                                  <div className="w-4 h-4 bg-orange-400 rounded-full flex-shrink-0"></div>
                                  <div>
                                    <p className="text-sm font-medium text-orange-800">
                                      Editing Experience
                                    </p>
                                    <p className="text-xs text-orange-700 mt-1">
                                      After updating, you can submit this experience for review again from the manage tab.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Preview Card */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <h4 className="font-semibold text-black mb-2">Experience Preview</h4>
                              <div className="space-y-2 text-sm">
                                <p className="text-black"><strong>Title:</strong> {formData.title || 'Not specified'}</p>
                                <p className="text-black"><strong>Category:</strong> {formData.domain || 'Not specified'}</p>
                                <p className="text-black"><strong>Duration:</strong> {formData.duration} minutes</p>
                                <p className="text-black"><strong>Price:</strong> ₹{formData.price || 'Not specified'} per person</p>
                                <p className="text-black"><strong>Location:</strong> {formData.neighborhood || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                          <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Back
                          </button>
                          
                          {step < 3 ? (
                            <button
                              onClick={handleNext}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              onClick={handleFormSubmit}
                              disabled={isSubmitting}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting 
                                ? (isEditMode ? 'Updating Experience...' : 'Creating Experience...') 
                                : (isEditMode ? 'Update Experience' : 'Create Experience')
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
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
    <AuthenticatedRoute>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>}>
        <HostDashboardContent />
      </Suspense>
    </AuthenticatedRoute>
  );
};

export default HostDashboard;