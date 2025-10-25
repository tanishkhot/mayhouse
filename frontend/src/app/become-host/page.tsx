'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkHostEligibility, submitHostApplication, getMyHostApplication, type EligibilityResponse, type HostApplicationSubmission, type HostApplication } from '@/lib/host-application-api';
import { AuthenticatedRoute } from '@/components/ProtectedRoute';
import EIP712PolicySigner from '@/components/EIP712PolicySigner';
import { useAccount } from 'wagmi';
import { PolicyAcceptanceRecord } from '@/lib/eip712-policy-api';

const EXPERIENCE_DOMAINS = [
  { value: 'food', label: 'Food & Culinary', icon: '🍲' },
  { value: 'culture', label: 'Culture & Traditions', icon: '🎭' },
  { value: 'history', label: 'History & Heritage', icon: '🏛️' },
  { value: 'art', label: 'Art & Galleries', icon: '🎨' },
  { value: 'music', label: 'Music & Performance', icon: '🎵' },
  { value: 'architecture', label: 'Architecture', icon: '🏗️' },
  { value: 'street_art', label: 'Street Art', icon: '🖌️' },
  { value: 'local_life', label: 'Local Life', icon: '🏠' },
  { value: 'markets', label: 'Markets & Shopping', icon: '🛍️' },
  { value: 'spiritual', label: 'Spiritual & Religious', icon: '🕉️' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { value: 'photography', label: 'Photography', icon: '📸' },
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const TIME_PREFERENCES = [
  { value: 'morning', label: 'Morning (6 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
  { value: 'evening', label: 'Evening (6 PM - 11 PM)' },
  { value: 'flexible', label: 'Flexible (Any time)' },
];

interface ApplicationFormData {
  experience_domains: string[];
  hosting_experience: string;
  why_host: string;
  sample_experience_idea: {
    title: string;
    description: string;
    duration: number;
    max_participants: number;
  };
  availability: {
    days: string[];
    time_preference: string;
    additional_notes: string;
  };
  languages_spoken: string[];
  special_skills: string;
  marketing_consent: boolean;
  // EIP-712 policy acceptances
  policy_acceptances: PolicyAcceptanceRecord[];
  policies_signed: boolean;
}

const BecomeHostPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'checking' | 'ineligible' | 'application' | 'existing' | 'submitted'>('checking');
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [existingApplication, setExistingApplication] = useState<HostApplication | null>(null);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    experience_domains: [],
    hosting_experience: '',
    why_host: '',
    sample_experience_idea: {
      title: '',
      description: '',
      duration: 180,
      max_participants: 4,
    },
    availability: {
      days: [],
      time_preference: '',
      additional_notes: '',
    },
    languages_spoken: ['english'],
    special_skills: '',
    marketing_consent: false,
    // EIP-712 policy acceptances
    policy_acceptances: [],
    policies_signed: false,
  });

  useEffect(() => {
    checkEligibilityAndApplicationStatus();
  }, []);

  // Handle policy signing completion
  const handlePolicySigningComplete = (acceptanceRecords: PolicyAcceptanceRecord[]) => {
    console.log('Policy signing completed:', acceptanceRecords);
    setFormData(prev => ({
      ...prev,
      policy_acceptances: acceptanceRecords,
      policies_signed: acceptanceRecords.length > 0,
    }));
  };

  // Handle policy signing errors
  const handlePolicySigningError = (error: string) => {
    console.error('Policy signing error:', error);
    setError(`Policy signing failed: ${error}`);
  };

  const checkEligibilityAndApplicationStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First check if user has an existing application
      const existing = await getMyHostApplication();
      if (existing) {
        setExistingApplication(existing);
        if (existing.status === 'approved') {
          setStep('submitted');
        } else {
          setStep('existing');
        }
        return;
      }

      // AUTO-APPROVE MODE: Skip eligibility check, everyone can become a host
      setStep('application');
      setEligibility({ 
        eligible: true, 
        message: 'Welcome! Fill out the form below to become a host.' 
      });
    } catch (err: unknown) {
      console.error('Error checking status:', err);
      // Even if there's an error, allow them to proceed
      setStep('application');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate required fields
      if (formData.experience_domains.length === 0) {
        throw new Error('Please select at least one experience domain');
      }
      if (formData.hosting_experience.length < 50) {
        throw new Error('Please provide at least 50 characters for hosting experience');
      }
      if (formData.why_host.length < 50) {
        throw new Error('Please provide at least 50 characters for why you want to host');
      }
      if (!formData.sample_experience_idea.title) {
        throw new Error('Please provide a title for your sample experience');
      }
      if (formData.sample_experience_idea.description.length < 20) {
        throw new Error('Please provide at least 20 characters for experience description');
      }
      if (formData.availability.days.length === 0) {
        throw new Error('Please select at least one available day');
      }
      if (!formData.availability.time_preference) {
        throw new Error('Please select a time preference');
      }
      if (!formData.policies_signed) {
        throw new Error('You must sign the required policy agreements');
      }

      const application: HostApplicationSubmission = {
        experience_domains: formData.experience_domains,
        hosting_experience: formData.hosting_experience,
        why_host: formData.why_host,
        sample_experience_idea: formData.sample_experience_idea,
        availability: {
          days: formData.availability.days as ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[],
          time_preference: formData.availability.time_preference as 'morning' | 'afternoon' | 'evening' | 'flexible',
          additional_notes: formData.availability.additional_notes,
        },
        languages_spoken: formData.languages_spoken,
        special_skills: formData.special_skills || undefined,
        // EIP-712 policy acceptances
        background_check_consent: formData.policy_acceptances.some(acc => acc.policy_type === 'background_verification'),
        terms_accepted: formData.policy_acceptances.some(acc => acc.policy_type === 'terms_conditions'),
        marketing_consent: formData.marketing_consent,
        // Include policy acceptance records for audit trail
        policy_acceptances: formData.policy_acceptances,
      };

      const result = await submitHostApplication(application);
      setExistingApplication(result);
      setStep('submitted');
      
    } catch (err: unknown) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Checking your eligibility...</p>
        </div>
      </div>
    );
  }

  if (step === 'ineligible') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Not Eligible</h1>
          <p className="text-gray-600 mb-4">{eligibility?.message || 'You are not eligible to apply at this time.'}</p>
          {eligibility?.reason === 'recent_rejection' && eligibility.can_reapply_at && (
            <p className="text-sm text-gray-500 mb-4">
              You can reapply on {new Date(eligibility.can_reapply_at).toLocaleDateString()}
            </p>
          )}
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'existing') {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Application Status</h1>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusColors[existingApplication!.status as keyof typeof statusColors]}`}>
            {existingApplication!.status.toUpperCase()}
          </div>
          <p className="text-gray-600 mb-4">
            You submitted your host application on {new Date(existingApplication!.applied_at).toLocaleDateString()}
          </p>
          {existingApplication!.status === 'pending' && (
            <p className="text-gray-500 text-sm mb-4">
              Your application is under review. You&apos;ll receive an email once it&apos;s processed.
            </p>
          )}
          {existingApplication!.admin_notes && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-1">Admin Notes:</p>
              <p className="text-sm text-gray-600">{existingApplication!.admin_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-4 text-green-600">You&apos;re Now a Host!</h1>
          <p className="text-gray-600 mb-4">
            Congratulations! Your host application has been automatically approved. You can now start creating experiences!
          </p>
          <div className="space-y-3 mt-6">
            <button
              onClick={() => router.push('/design-experience')}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Create Your First Experience
            </button>
            <button
              onClick={() => router.push('/host-dashboard')}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Go to Host Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Become a Mayhouse Host</h1>
            <p className="text-gray-600 mb-8">Share your passion for Mumbai and create authentic experiences for travelers</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSubmitApplication(); }} className="space-y-8">
            {/* Experience Domains */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What types of experiences would you like to host? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EXPERIENCE_DOMAINS.map((domain) => (
                  <label key={domain.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.experience_domains.includes(domain.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            experience_domains: [...prev.experience_domains, domain.value]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            experience_domains: prev.experience_domains.filter(d => d !== domain.value)
                          }));
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="mr-2">{domain.icon}</span>
                    <span className="text-sm">{domain.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hosting Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about your hosting experience *
              </label>
              <textarea
                value={formData.hosting_experience}
                onChange={(e) => setFormData(prev => ({ ...prev, hosting_experience: e.target.value }))}
                placeholder="Describe any previous hosting experience, tour guiding, or similar activities..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={4}
                minLength={50}
                required
              />
              <p className="text-sm text-gray-500 mt-1">{formData.hosting_experience.length}/50 characters minimum</p>
            </div>

            {/* Why Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to become a host? *
              </label>
              <textarea
                value={formData.why_host}
                onChange={(e) => setFormData(prev => ({ ...prev, why_host: e.target.value }))}
                placeholder="What motivates you to share your city with travelers?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={4}
                minLength={50}
                required
              />
              <p className="text-sm text-gray-500 mt-1">{formData.why_host.length}/50 characters minimum</p>
            </div>

            {/* Sample Experience */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sample Experience Idea</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Title *
                  </label>
                  <input
                    type="text"
                    value={formData.sample_experience_idea.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sample_experience_idea: { ...prev.sample_experience_idea, title: e.target.value }
                    }))}
                    placeholder="e.g., Hidden Street Food Gems of Bandra"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Description *
                  </label>
                  <textarea
                    value={formData.sample_experience_idea.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sample_experience_idea: { ...prev.sample_experience_idea, description: e.target.value }
                    }))}
                    placeholder="Describe what travelers will experience..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    minLength={20}
                    maxLength={500}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{formData.sample_experience_idea.description.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <select
                      value={formData.sample_experience_idea.duration}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sample_experience_idea: { ...prev.sample_experience_idea, duration: parseInt(e.target.value) }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={150}>2.5 hours</option>
                      <option value={180}>3 hours</option>
                      <option value={240}>4 hours</option>
                      <option value={300}>5 hours</option>
                      <option value={360}>6 hours</option>
                      <option value={480}>8 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants *
                    </label>
                    <select
                      value={formData.sample_experience_idea.max_participants}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sample_experience_idea: { ...prev.sample_experience_idea, max_participants: parseInt(e.target.value) }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value={1}>1 person</option>
                      <option value={2}>2 people</option>
                      <option value={3}>3 people</option>
                      <option value={4}>4 people</option>
                      <option value={5}>5 people</option>
                      <option value={6}>6 people</option>
                      <option value={8}>8 people</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Availability Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Which days are you typically available? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <label key={day.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.availability.days.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  days: [...prev.availability.days, day.value]
                                }
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  days: prev.availability.days.filter(d => d !== day.value)
                                }
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred time slots *
                  </label>
                  <select
                    value={formData.availability.time_preference}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, time_preference: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a time preference</option>
                    {TIME_PREFERENCES.map((time) => (
                      <option key={time.value} value={time.value}>{time.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional availability notes
                  </label>
                  <input
                    type="text"
                    value={formData.availability.additional_notes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, additional_notes: e.target.value }
                    }))}
                    placeholder="Any specific timing preferences or constraints..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            {/* Languages and Skills */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages spoken
                </label>
                <input
                  type="text"
                  value={formData.languages_spoken.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    languages_spoken: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)
                  }))}
                  placeholder="e.g., English, Hindi, Marathi"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special skills or knowledge
                </label>
                <input
                  type="text"
                  value={formData.special_skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_skills: e.target.value }))}
                  placeholder="e.g., Photography, Cooking, History"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={500}
                />
              </div>
            </div>

            {/* EIP-712 Policy Signing */}
            <div className="space-y-6">
              <EIP712PolicySigner
                userId={address || 'temp_user_id'} // Use wallet address as user ID
                context="host_application"
                requiredPolicies={['terms_conditions', 'background_verification']}
                onSigningComplete={handlePolicySigningComplete}
                onError={handlePolicySigningError}
                className="bg-gray-50 p-6 rounded-lg"
              />

              {/* Marketing Consent (still a simple checkbox) */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.marketing_consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketing_consent: e.target.checked }))}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Marketing Communications (Optional)</strong>
                    <br />
                    I&apos;d like to receive updates about hosting opportunities and platform news.
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting Application...' : 'Submit Host Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </AuthenticatedRoute>
  );
};

export default BecomeHostPage;
