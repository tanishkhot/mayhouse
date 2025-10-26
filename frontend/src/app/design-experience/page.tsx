'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HostOnlyRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { ExperiencePhotoUpload } from '@/components/ExperiencePhotoUpload';

const DesignExperienceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitForReview, setSubmitForReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
  const [createdExperienceId, setCreatedExperienceId] = useState<string | null>(null);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);

  // Define fetchExperienceData before using it in useEffect
  const fetchExperienceData = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('mayhouse_token');
      if (!token) {
        alert('Authentication required');
        router.push('/login');
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
      alert('Network error while loading experience. Please try again.');
      router.push('/host-dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Check if we're in edit mode and fetch experience data
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setExperienceId(editId);
      fetchExperienceData(editId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams, fetchExperienceData]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitForReview = async () => {
    const expId = createdExperienceId || experienceId;
    
    if (!expId) {
      alert('No experience found to submit. Please save your experience first.');
      return;
    }

    setIsSubmittingForReview(true);

    try {
      console.log('📤 Submitting experience for review...');
      
      // Get current user to extract host_id
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;
      console.log('👤 User data:', { id: userData.id, role: userData.role });
      
      // Submit with correct payload structure
      const submitPayload = {
        host_id: userData.id,
        submission_data: {
          submission_notes: 'Ready for admin review',
          ready_for_review: true
        }
      };
      
      console.log('📤 Submission payload:', submitPayload);
      
      const submitResponse = await api.post(`/experiences/${expId}/submit`, submitPayload);
      console.log('✅ Submission successful:', submitResponse.data);
      
      alert('Experience submitted for review! You can track its status in your dashboard.');
      router.push('/host-dashboard');
    } catch (error: any) {
      console.error('❌ Submission failed:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 'Failed to submit for review. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmittingForReview(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!validateAllFields()) {
      const errorMessages = Object.values(fieldErrors).filter(Boolean);
      alert('Please fix the following issues:\n\n' + errorMessages.join('\n'));
      return;
    }

    const actionText = isEditMode ? 'updating' : 'creating';
    console.log(`📝 FORM: Starting experience ${actionText}...`);
    console.log('📝 FORM: Form data:', formData);
    console.log('📝 FORM: Edit mode:', isEditMode);
    console.log('📝 FORM: Experience ID:', experienceId);
    
    setIsSubmitting(true);
    
    try {
      // Create the experience payload matching backend schema
      const experienceData = {
        title: formData.title,
        promise: formData.description.substring(0, 200), // Use first 200 chars of description as promise
        description: formData.description,
        unique_element: formData.whatToExpect || `This ${formData.domain} experience offers authentic local insights and memorable moments.`,
        host_story: `As a passionate local guide, I created this ${formData.domain} experience to share the authentic side of Mumbai with travelers.`,
        experience_domain: formData.domain,
        experience_theme: formData.theme,
        neighborhood: formData.neighborhood,
        meeting_landmark: formData.meetingPoint.split(',')[0] || formData.meetingPoint, // Extract landmark from meeting point
        meeting_point_details: formData.meetingPoint,
        duration_minutes: formData.duration,
        traveler_max_capacity: formData.maxCapacity,
        price_inr: parseFloat(formData.price),
        inclusions: ['Professional local guide', 'All activities mentioned in description'],
        traveler_should_bring: formData.whatToBring ? [formData.whatToBring] : ['Comfortable walking shoes', 'Camera (optional)'],
        accessibility_notes: formData.requirements ? [formData.requirements] : [],
        experience_safety_guidelines: formData.whatToKnow
      };
      
      console.log('📤 FORM: Sending experience data:', experienceData);
      console.log('🔐 FORM: Searching for authentication token...');
      
      // Check multiple possible token storage keys
      const possibleTokenKeys = [
        'mayhouse_token',    // Your app's token key!
        'token',
        'access_token', 
        'authToken',
        'supabase.auth.token',
        'sb-access-token',
        'auth_token'
      ];
      
      let token = null;
      let tokenSource = null;
      
      // Debug: Show all localStorage contents
      console.log('🔍 FORM: All localStorage contents:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          console.log(`  ${key}: ${value ? `${value.substring(0, 30)}...` : 'null'}`);
        }
      }
      
      // Try to find a valid token
      for (const key of possibleTokenKeys) {
        const storedToken = localStorage.getItem(key);
        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined' && storedToken.length > 10) {
          token = storedToken;
          tokenSource = key;
          console.log(`✅ FORM: Found token in '${key}': ${token.substring(0, 20)}...`);
          break;
        }
      }
      
      // If no token found in simple keys, check Supabase session
      if (!token) {
        console.log('🔍 FORM: Checking for Supabase session...');
        
        // Check for Supabase session in localStorage
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-')
        );
        
        console.log('🔍 FORM: Supabase-related keys:', supabaseKeys);
        
        for (const key of supabaseKeys) {
          const value = localStorage.getItem(key);
          console.log(`🔍 FORM: ${key}:`, value ? `${value.substring(0, 50)}...` : 'null');
          
          // Try to parse Supabase session data
          if (value && value.startsWith('{')) {
            try {
              const sessionData = JSON.parse(value);
              if (sessionData.access_token) {
                token = sessionData.access_token;
                tokenSource = `${key}.access_token`;
                console.log(`✅ FORM: Found Supabase token in '${key}': ${token.substring(0, 20)}...`);
                break;
              }
            } catch (_e) {
              console.log(`❌ FORM: Could not parse ${key} as JSON`);
            }
          }
        }
        
        if (!token) {
          console.log('❌ FORM: No valid token found in any expected location');
        }
      }
      
      // DEBUG MODE: Use mock token for testing (remove this in production)
      const isDebugMode = process.env.NODE_ENV === 'development' && window.location.search.includes('debug=true');
      if (isDebugMode) {
        console.log('🚷 FORM: DEBUG MODE - Using mock token');
        token = 'debug-mock-token-for-testing';
        alert('DEBUG MODE: Using mock token. This will fail authentication but show the full flow.');
      }
      
      // Check if we have a valid token
      if (!token || token === 'null' || token === 'undefined') {
        // Show detailed debug info for developers
        const allStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            allStorageKeys.push(key);
          }
        }
        
        const errorMessage = `
🔐 AUTHENTICATION ERROR:
No valid token found for creating experiences.

📋 DEBUG INFO:
- Available localStorage keys: ${allStorageKeys.join(', ')}
- Please log in as a host user
- Or add ?debug=true to test the API flow

Check the browser console for detailed token search results.`;
        
        alert(errorMessage);
        console.log('FORM: No valid token found, cannot proceed');
        console.log('FORM: Available localStorage keys:', allStorageKeys);
        // router.push('/login'); // Commented out for testing
        return;
      }
      
      console.log(`FORM: Using token from '${tokenSource}': ${token.substring(0, 20)}...`);
      console.log(`FORM: Token length: ${token.length}`);
      console.log(`FORM: Token type: ${typeof token}`);

      // Use the api client instead of fetch for proper routing
      console.log('FORM: Using api client to create experience');
      console.log('FORM: Experience data:', experienceData);
      
      let response;
      if (isEditMode) {
        response = await api.put(`/experiences/${experienceId}`, experienceData);
      } else {
        response = await api.post('/experiences', experienceData);
      }
      
      console.log('📨 FORM: Response received:', response);

      // Axios response structure
      const result = response.data;
      console.log(`✅ FORM: Experience ${isEditMode ? 'updated' : 'created'} successfully:`, result);
        
        // Store the created experience ID for photo upload
        if (!isEditMode && result.id) {
          setCreatedExperienceId(result.id);
          // Move to photo upload step
          setStep(4);
        }
        
        if (isEditMode) {
          // For updates, just show success message and redirect
          alert('Experience updated successfully! You can now submit it for review again from your dashboard.');
          router.push('/host-dashboard');
        } else {
          // For new experiences, don't redirect yet - let them upload photos
          // Submission will be handled from the dashboard
        }
    } catch (error: any) {
      console.log('💥 FORM: Error:', error);
      console.error('Error creating experience:', error);
      
      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        console.log('❌ FORM: Error response:', errorData);
        
        if (error.response.status === 401) {
          alert('Authentication failed. Please log in again.');
          router.push('/login');
        } else if (error.response.status === 403) {
          alert('Access denied. You need host privileges to create experiences.');
        } else if (error.response.status === 422 && errorData.detail) {
          // Handle validation errors
          let errorMessage = 'Validation error:\n\n';
          if (Array.isArray(errorData.detail)) {
            errorMessage += errorData.detail.map((err: any) => 
              `${err.loc?.join(' -> ')}: ${err.msg}`
            ).join('\n');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail, null, 2);
          }
          alert(errorMessage);
        } else {
          const errorMessage = errorData.detail || errorData.message || 'Failed to create experience';
          alert(`Error: ${errorMessage}`);
        }
      } else if (error.request) {
        // Request made but no response
        alert('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        alert(`Error: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation rules
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

  // Show loading state while fetching experience data
  if (isLoading) {
    return (
      <HostOnlyRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-black">Loading experience data...</p>
          </div>
        </div>
      </HostOnlyRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {isEditMode ? 'Edit Your Experience' : 'Design Your Experience'}
                </h1>
                <p className="text-black">
                  {isEditMode ? 'Update your local adventure for travelers' : 'Create a unique local adventure for travelers'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4].map((num) => (
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
              <span className="text-sm text-black">Step {step} of 4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black mb-6">Basic Information</h2>
                
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
                    minLength={10}
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
                    placeholder="Describe what makes your experience unique and exciting. Include details about what travelers will see, do, and learn during this adventure. Mention the cultural significance, local stories, and memorable moments they can expect..."
                    rows={4}
                    className={getFieldClasses('description')}
                    minLength={100}
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
                      value={formData.duration || ''}
                      onChange={(e) => updateFormData('duration', parseInt(e.target.value) || 30)}
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
                <h2 className="text-xl font-semibold text-black mb-6">Experience Details</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Max Participants *
                    </label>
                    <input
                      type="number"
                      value={formData.maxCapacity || ''}
                      onChange={(e) => updateFormData('maxCapacity', parseInt(e.target.value) || 1)}
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
                    placeholder="Describe the unique highlights and special moments participants will experience during this adventure. What makes this experience truly memorable and different from others?"
                    rows={3}
                    className={getFieldClasses('whatToExpect')}
                    minLength={50}
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
                <h2 className="text-xl font-semibold text-black mb-6">Additional Information</h2>
                
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
                    placeholder="Items participants should bring (comfortable shoes, camera, etc.)"
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
                    placeholder="Important information, cancellation policy, weather considerations, etc."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black mb-6">Photos & Final Review</h2>
                
                {/* Photo Upload Section */}
                <div className="mb-8">
                  {(createdExperienceId || experienceId) ? (
                    <ExperiencePhotoUpload 
                      experienceId={createdExperienceId || experienceId || ''}
                      maxPhotos={10}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Please save your experience first to upload photos
                      </p>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving Experience...' : 'Save Experience'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit for Review Section - Only show for new experiences */}
                {!isEditMode && (createdExperienceId || experienceId) && (
                  <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">
                      Ready to Submit?
                    </h3>
                    <p className="text-sm text-green-800 mb-4">
                      Your experience has been created and photos have been uploaded! You can now submit it for admin review, or save it as a draft and submit later from your dashboard.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmitForReview}
                        disabled={isSubmittingForReview}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isSubmittingForReview ? 'Submitting...' : 'Submit for Review'}
                      </button>
                      <button
                        onClick={() => router.push('/host-dashboard')}
                        disabled={isSubmittingForReview}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Save as Draft
                      </button>
                    </div>
                    <p className="text-xs text-green-700 mt-3">
                      Tip: Once submitted, your experience will be reviewed by our team. You&apos;ll be notified of the decision.
                    </p>
                  </div>
                )}
                
                {/* Edit mode info */}
                {isEditMode && (
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-orange-400 rounded-full shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Editing Experience
                        </p>
                        <p className="text-xs text-orange-700 mt-1">
                          After updating, you can submit this experience for review again from your dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Card */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-black mb-2">Experience Preview</h3>
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
              ) : step === 3 ? (
                <button
                  onClick={() => {
                    // If experience is already created, just go to next step
                    if (createdExperienceId || experienceId) {
                      handleNext();
                    } else {
                      // Otherwise, create the experience first
                      handleSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Updating Experience...' : 'Creating Experience...') 
                    : 'Continue to Photos'
                  }
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/host-dashboard')}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

const DesignExperiencePage = () => {
  return (
    <HostOnlyRoute>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>}>
        <DesignExperienceContent />
      </Suspense>
    </HostOnlyRoute>
  );
};

export default DesignExperiencePage;