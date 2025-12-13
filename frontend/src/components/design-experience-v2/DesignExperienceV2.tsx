'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Edit3,
  HelpCircle,
  Upload,
  Trash2,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { MapPicker } from '@/components/ui/map-picker';
import Icon from '../ui/icon';
import { DesignExperienceAPI } from '@/lib/design-experience-api';
import { toast } from 'sonner';
import { AIChatSidebar, ChatMessage } from './AIChatSidebar';
import GuidedQAFlow from './GuidedQAFlow';
import GuidedQAIntro from './GuidedQAIntro';
import { experienceAPI } from '@/lib/experience-api';
import { mapFormToExperienceCreate } from '@/lib/experience-mapper';
import { useRouter } from 'next/navigation';
import { AuthAPI, UserResponse, api } from '@/lib/api';
import ExperiencePreviewCard from './ExperiencePreviewCard';
import { ExperiencePreviewModal } from '@/components/experience-preview';
import { normalizeFormState } from '@/lib/experience-preview-normalizer';
import { PhotoArray } from '@/lib/experience-preview-types';

type FormState = {
  title: string;
  description: string;
  domain: string;
  theme: string;
  duration: number;
  maxCapacity: number;
  price: string;
  neighborhood: string;
  meetingPoint: string;
  latitude?: number;
  longitude?: number;
  requirements: string;
  whatToExpect: string;
  whatToKnow: string;
  whatToBring: string;
};

const INITIAL: FormState = {
  title: '',
  description: '',
  domain: '',
  theme: '',
  duration: 180,
  maxCapacity: 4,
  price: '',
  neighborhood: '',
  meetingPoint: '',
  latitude: undefined,
  longitude: undefined,
  requirements: '',
  whatToExpect: '',
  whatToKnow: '',
  whatToBring: '',
};

export default function DesignExperienceV2() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'kickstart' | 'describe' | 'guided'>('kickstart');
  const [hasStartedGuidedFlow, setHasStartedGuidedFlow] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; isCover: boolean; caption?: string }>>([]);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm here to help you refine your experience. Ask me anything or request changes to specific fields.",
      timestamp: new Date(),
    },
  ]);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);

  // Fetch current user data for preview
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await AuthAPI.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Continue without user data - preview will show placeholder
      }
    };
    fetchUser();
  }, []);

  // Check if form has minimum data for preview
  const canShowPreview = useMemo(() => {
    return form.title.trim().length >= 10 && form.description.trim().length >= 50;
  }, [form]);

  useEffect(() => {
    try {
      console.log('[FLOW] DesignExperienceV2 mounted', { ts: new Date().toISOString() });
    } catch {}
  }, []);

  // Reset hasStartedGuidedFlow when mode changes away from 'guided'
  useEffect(() => {
    if (mode !== 'guided') {
      setHasStartedGuidedFlow(false);
    }
  }, [mode]);

  useEffect(() => {
    try {
      console.log('[FLOW] DesignExperienceV2 step change', { step, ts: new Date().toISOString() });
    } catch {}
  }, [step]);

  // Keyboard shortcut: Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger when on the describe step (step 0, mode 'describe')
      if (step === 0 && mode === 'describe') {
        // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows)
        const isModifierPressed = e.metaKey || e.ctrlKey;
        if (isModifierPressed && e.key === 'Enter') {
          // Only trigger if button is not disabled
          if (!isGenerating && descriptionInput.trim() && descriptionInput.trim().length >= 20) {
            e.preventDefault();
            handleGenerateExperience();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode, isGenerating, descriptionInput]);

  const handleGenerateExperience = async () => {
    if (!descriptionInput.trim()) {
      toast.error('Please enter a description of your experience');
      return;
    }

    if (descriptionInput.trim().length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await DesignExperienceAPI.generateExperience(descriptionInput.trim());
      
      // Create form data from generated experience
      const generatedFormData: FormState = {
        title: generated.title,
        description: generated.description,
        domain: generated.domain,
        theme: generated.theme || '',
        duration: generated.duration_minutes,
        maxCapacity: generated.max_capacity,
        price: generated.price_inr ? generated.price_inr.toString() : '',
        neighborhood: generated.neighborhood || '',
        meetingPoint: generated.meeting_point || '',
        requirements: generated.requirements?.join(', ') || '',
        whatToExpect: generated.what_to_expect,
        whatToKnow: generated.what_to_know || '',
        whatToBring: generated.what_to_bring?.join(', ') || '',
      };

      // Populate form state for UI
      setForm(generatedFormData);

      // Auto-save as draft (don't redirect, let user review first)
      toast.info('Saving experience as draft...');
      const saved = await saveExperienceFromData(generatedFormData, false, false);
      
      if (saved) {
        toast.success('Experience generated and saved as draft! Review and edit the fields below.');
      } else {
        toast.warning('Experience generated but could not be auto-saved. Please save manually.');
      }

      // Reset mode and redirect to step 1 (scratch experience screen)
      // Open the form sidebar so user can see the generated data
      setMode('kickstart');
      setStep(1);
      setFormOpen(true); // Open the form sidebar to show generated data
    } catch (error: any) {
      console.error('Error generating experience:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to generate experience. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveExperienceFromData = async (formData: FormState, showSuccessToast: boolean = true, redirect: boolean = true) => {
    // Validate required fields
    if (!formData.title || formData.title.trim().length < 10) {
      toast.error('Title must be at least 10 characters');
      return null;
    }
    if (!formData.description || formData.description.trim().length < 100) {
      toast.error('Description must be at least 100 characters');
      return null;
    }
    if (!formData.domain) {
      toast.error('Please select a category');
      return null;
    }
    if (!formData.meetingPoint || formData.meetingPoint.trim().length === 0) {
      toast.error('Please provide a meeting point');
      return null;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return null;
    }
    if (!formData.whatToExpect || formData.whatToExpect.trim().length < 50) {
      toast.error('What to expect must be at least 50 characters');
      return null;
    }

    setIsSaving(true);
    try {
      // Map form data to ExperienceCreate format
      const experienceData = mapFormToExperienceCreate(formData);

      // Create experience via API
      const createdExperience = await experienceAPI.createExperience(experienceData);

      if (showSuccessToast) {
        toast.success('Experience saved as draft!');
      }
      
      if (redirect) {
        // Redirect to host dashboard
        router.push('/host-dashboard');
      }
      
      return createdExperience;
    } catch (error: any) {
      console.error('Error saving experience:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save experience. Please try again.';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExperience = async () => {
    const createdExperience = await saveExperienceFromData(form, true, true);
    
    // If ready to submit and experience was created, submit for review
    if (readyToSubmit && createdExperience?.id) {
      try {
        const user = currentUser || await AuthAPI.me();
        if (!user || !user.id) {
          toast.error('User authentication required');
          return;
        }

        await api.post(`/experiences/${createdExperience.id}/submit`, {
          host_id: user.id,
          submission_data: {
            submission_notes: 'Ready for admin review',
            ready_for_review: true
          }
        });

        toast.success('Experience submitted for review!');
        router.push('/host-dashboard');
      } catch (error: any) {
        console.error('Error submitting experience:', error);
        toast.error('Experience saved, but failed to submit for review. You can submit it from your dashboard.');
        router.push('/host-dashboard');
      }
    }
  };

  const completion = useMemo(() => {
    const basicsOk =
      form.title.trim().length >= 10 &&
      form.description.trim().length >= 100 &&
      form.whatToExpect.trim().length >= 50 &&
      !!form.domain;
    const detailsOk =
      form.maxCapacity >= 1 &&
      !!form.price &&
      !!form.neighborhood &&
      !!form.meetingPoint;
    const mediaOk = photos.length > 0;
    return { basicsOk, detailsOk, mediaOk };
  }, [form, photos]);

  const fieldClasses = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-black focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:ring-terracotta-500 focus:border-terracotta-500'}`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${chatOpen && step > 0 ? 'mr-96' : ''}`}>
        {/* Header - Only show on step 0 */}
        {step === 0 && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Kickstart Your Experience
                </h1>
                <p className="text-black/70">
                  Choose how you want to begin. We&apos;ll guide you the rest of the way.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 0 - Kickstart choices */}
        {step === 0 && mode === 'kickstart' && (
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="h-12 w-12 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center">
                <Icon as={Sparkles} size={24} className="text-terracotta-600" />
              </div>
              <h2 className="text-xl font-semibold text-black">Design Your Experience</h2>
              <p className="text-black/70 text-center">
                Tell us about the experience you want to create. Our UI will help you craft a compelling listing.
              </p>
            </div>

            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
              <button
                onClick={() => setMode('describe')}
                className="text-left bg-white rounded-xl border shadow-[0_4px_14px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.10),0_4px_10px_rgba(0,0,0,0.06)] transition p-6"
              >
                <div className="h-9 w-9 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center mb-3">
                  <Icon as={Edit3} size={18} className="text-terracotta-600" />
                </div>
                <div className="font-medium text-black mb-1">Describe Your Experience</div>
                <div className="text-sm text-black/70">
                  Tell us in your own words. We’ll handle the structure.
                </div>
              </button>

              <button
                onClick={() => {
                  setMode('guided');
                  setHasStartedGuidedFlow(false);
                }}
                className="text-left bg-white rounded-xl border shadow-[0_4px_14px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.10),0_4px_10px_rgba(0,0,0,0.06)] transition p-6"
              >
                <div className="h-9 w-9 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center mb-3">
                  <Icon as={HelpCircle} size={18} className="text-terracotta-600" />
                </div>
                <div className="font-medium text-black mb-1">Answer Guided Questions</div>
                <div className="text-sm text-black/70">
                  We’ll ask specific questions to build your listing.
                </div>
              </button>
            </div>

            <div className="text-center pt-4">
              <button onClick={() => setStep(1)} className="text-sm text-black/70 underline">
                Start from scratch instead
              </button>
            </div>
          </div>
        )}

        {/* Step 0.A - Describe Your Experience */}
        {step === 0 && mode === 'describe' && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl border shadow-sm p-8">
            <button
              onClick={() => setMode('kickstart')}
              className="text-sm text-black/70 mb-6 hover:underline"
            >
              <span className="inline-flex items-center gap-1">
                <Icon as={ChevronLeft} size={16} className="text-black/70" />
                Back
              </span>
            </button>
            <h3 className="text-xl font-semibold text-black mb-2">Describe Your Experience</h3>
            <p className="text-black/70 mb-6">
              Share your vision in your own words. Include what makes it special, where it happens, and what travelers will experience.
            </p>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              maxLength={2000}
              onKeyDown={(e) => {
                // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate
                const isModifierPressed = e.metaKey || e.ctrlKey;
                if (isModifierPressed && e.key === 'Enter') {
                  if (!isGenerating && descriptionInput.trim() && descriptionInput.trim().length >= 20) {
                    e.preventDefault();
                    handleGenerateExperience();
                  }
                }
              }}
              className="w-full min-h-[160px] border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              placeholder="Example: A sunset heritage walk through old Bangalore markets where we discover century‑old spice merchants, family‑run sweet shops, and hidden temples..."
            />
            <div className="mt-2 text-xs text-black/60">
              {descriptionInput.length} characters · The more detail, the better the draft
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleGenerateExperience}
                disabled={isGenerating || !descriptionInput.trim() || descriptionInput.trim().length < 20}
                className="flex-1 bg-black text-white rounded-lg py-2 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon as={Sparkles} size={16} className="text-white" />
                    Generate My Experience
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                {typeof window !== 'undefined' && (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0) ? '⌘' : 'Ctrl'}
              </kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to generate
            </div>
            <div className="mt-6 rounded-lg border bg-gray-50 p-4 text-sm text-black/80">
              <div className="mb-2 inline-flex items-center gap-2">
                <div className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100">
                  <Icon as={Sparkles} size={14} className="text-blue-700" />
                </div>
                <strong>Example prompt:</strong>
              </div>
              <div>
                “I want to host a cooking class in my home where we make traditional Karnataka breakfast
                items like dosas, idlis, and chutneys. I’ll share family recipes passed down three generations,
                and we’ll shop for fresh ingredients at the local market first. Perfect for food lovers who want
                hands‑on experience.”
              </div>
            </div>
          </div>
        )}

        {/* Step 0.B - Guided Questions Intro */}
        {step === 0 && mode === 'guided' && !hasStartedGuidedFlow && (
          <GuidedQAIntro
            onStart={() => setHasStartedGuidedFlow(true)}
            onCancel={() => {
              setMode('kickstart');
              setHasStartedGuidedFlow(false);
            }}
          />
        )}

        {/* Step 0.C - Guided Questions Flow */}
        {step === 0 && mode === 'guided' && hasStartedGuidedFlow && (
          <GuidedQAFlow
            onComplete={async (generated) => {
              // Create form data from generated experience
              const generatedFormData: FormState = {
                title: generated.title,
                description: generated.description,
                domain: generated.domain,
                theme: generated.theme || '',
                duration: generated.duration_minutes,
                maxCapacity: generated.max_capacity,
                price: generated.price_inr ? generated.price_inr.toString() : '',
                neighborhood: generated.neighborhood || '',
                meetingPoint: generated.meeting_point || '',
                requirements: generated.requirements?.join(', ') || '',
                whatToExpect: generated.what_to_expect,
                whatToKnow: generated.what_to_know || '',
                whatToBring: generated.what_to_bring?.join(', ') || '',
              };

              // Populate form state for UI
              setForm(generatedFormData);

              // Auto-save as draft (don't redirect, let user review first)
              toast.info('Saving experience as draft...');
              const saved = await saveExperienceFromData(generatedFormData, false, false);
              
              if (saved) {
                toast.success('Experience generated and saved as draft! Review and edit the fields below.');
              } else {
                toast.warning('Experience generated but could not be auto-saved. Please save manually.');
              }

              // Reset mode and redirect to step 1 (form editing screen)
              setMode('kickstart');
              setHasStartedGuidedFlow(false);
              setStep(1);
            }}
            onCancel={() => {
              setMode('kickstart');
              setHasStartedGuidedFlow(false);
            }}
          />
        )}


        {/* Form and Preview Layout */}
        {step > 0 && (
        <div className="relative">
          {/* Form Card - Sidebar when open */}
          {formOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setFormOpen(false)} />
              <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xl bg-white border-r shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black">Edit Experience</h2>
                    <button
                      onClick={() => setFormOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Icon as={ChevronLeft} size={20} />
                    </button>
                  </div>
                  <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Experience Title * (minimum 10 characters)
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  maxLength={2000}
                  placeholder="e.g., Mumbai Street Food Adventure with Local Guide"
                  className={fieldClasses(form.title.trim().length > 0 && form.title.trim().length < 10)}
                />
                <p className="text-xs text-gray-500 mt-1">{form.title.length}/10+ characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description * (minimum 100 characters)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  maxLength={2000}
                  rows={4}
                  placeholder="Describe what makes your experience unique and exciting..."
                  className={fieldClasses(form.description.trim().length > 0 && form.description.trim().length < 100)}
                />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/100+ characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Category *</label>
                  <select
                    value={form.domain}
                    onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                    className={fieldClasses(form.domain === '' && false)}
                  >
                    <option value="">Select category</option>
                    <option value="food">Food & Culinary</option>
                    <option value="culture">Culture & Heritage</option>
                    <option value="art">Art & Creativity</option>
                    <option value="history">History & Stories</option>
                    <option value="nature">Nature & Outdoors</option>
                    <option value="nightlife">Nightlife & Entertainment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value || '0', 10) }))}
                    min={30}
                    max={480}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Experience Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Max Participants *</label>
                  <input
                    type="number"
                    value={form.maxCapacity}
                    onChange={(e) => setForm((p) => ({ ...p, maxCapacity: parseInt(e.target.value || '1', 10) }))}
                    min={1}
                    max={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Price per Person (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="2000"
                    className={fieldClasses(form.price.trim().length === 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Neighborhood *</label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                  maxLength={2000}
                  placeholder="e.g., Colaba, Bandra, Andheri"
                  className={fieldClasses(form.neighborhood.trim().length === 0)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <Icon as={MapPin} size={16} className="text-terracotta-600" />
                  <span>Meeting Point *</span>
                </label>
                <div className="space-y-2">
                  <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-200">
                    <MapPicker
                      value={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude, name: form.meetingPoint } : undefined}
                      onChange={(loc) => {
                        setForm((p) => ({
                          ...p,
                          meetingPoint: loc.name,
                          latitude: loc.lat,
                          longitude: loc.lng
                        }));
                      }}
                      height="100%"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.meetingPoint}
                    onChange={(e) => setForm((p) => ({ ...p, meetingPoint: e.target.value }))}
                    maxLength={2000}
                    placeholder="e.g., Gateway of India, Main Entrance (or select on map)"
                    className={fieldClasses(form.meetingPoint.trim().length === 0)}
                  />
                  <p className="text-xs text-gray-500">
                    Search or click on the map to set the precise location. You can also edit the address text manually.
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <Icon as={Clock} size={16} className="text-terracotta-600" />
                  <span>What to Expect * (min 50 chars)</span>
                </label>
                <textarea
                  value={form.whatToExpect}
                  onChange={(e) => setForm((p) => ({ ...p, whatToExpect: e.target.value }))}
                  maxLength={2000}
                  rows={3}
                  placeholder="Describe the unique highlights and special moments..."
                  className={fieldClasses(form.whatToExpect.trim().length > 0 && form.whatToExpect.trim().length < 50)}
                />
                <p className="text-xs text-gray-500 mt-1">{(form.whatToExpect || '').length}/50+ characters</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Additional Information</h2>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Requirements & Prerequisites</label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                  maxLength={2000}
                  rows={2}
                  placeholder="Any age restrictions, fitness requirements, etc..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">What to Bring</label>
                <textarea
                  value={form.whatToBring}
                  onChange={(e) => setForm((p) => ({ ...p, whatToBring: e.target.value }))}
                  maxLength={2000}
                  rows={2}
                  placeholder="Items participants should bring (comfortable shoes, camera, etc.)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Good to Know</label>
                <textarea
                  value={form.whatToKnow}
                  onChange={(e) => setForm((p) => ({ ...p, whatToKnow: e.target.value }))}
                  maxLength={2000}
                  rows={3}
                  placeholder="Important information, cancellation policy, weather considerations, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Photos & Final Review</h2>

            <div className="mb-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 shadow-[0_4px_14px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)]"
                  onClick={() => document.getElementById('v2-photo-input')?.click()}
                >
                  <input
                    id="v2-photo-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const next: Array<{ id: string; url: string; isCover: boolean; caption?: string }> = [];
                      const list = Array.from(files).slice(0, Math.max(0, 10 - photos.length));
                      for (const f of list) {
                        next.push({ id: `local-${f.name}-${Date.now()}`, url: URL.createObjectURL(f), isCover: false });
                      }
                      setPhotos((prev) => {
                        const merged = [...prev, ...next].slice(0, 10);
                        if (!merged.some((p) => p.isCover) && merged.length > 0) merged[0].isCover = true;
                        return merged;
                      });
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <Icon as={Upload} size={16} className="text-gray-700" />
                    <p className="text-sm">Drop photos here or click to upload</p>
                  </div>
                  <p className="text-xs text-gray-500">JPEG, PNG, or WebP (max 10 photos)</p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((p, idx) => (
                    <div key={p.id} className="relative rounded-lg overflow-hidden border border-gray-200">
                      <div className="aspect-square relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {p.isCover && (
                          <div className="absolute top-2 left-2 bg-terracotta-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Cover Photo
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 hover:bg-black/40 transition">
                          {!p.isCover && (
                            <button
                              aria-label="Set as cover"
                              onClick={() =>
                                setPhotos((prev) => prev.map((x) => ({ ...x, isCover: x.id === p.id })))
                              }
                              className="opacity-0 hover:opacity-100 bg-white text-black text-xs px-3 py-1 rounded inline-flex items-center gap-1"
                            >
                              <Icon as={CheckCircle2 as any} size={14} className="text-emerald-600" />
                              Set as Cover
                            </button>
                          )}
                          <button
                            aria-label="Delete photo"
                            onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                              className="opacity-0 hover:opacity-100 bg-terracotta-500 text-white text-xs px-3 py-1 rounded inline-flex items-center gap-1"
                          >
                            <Icon as={Trash2} size={14} className="text-white" />
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50">
                        <input
                          type="text"
                          placeholder="Add a caption..."
                          value={p.caption || ''}
                          onChange={(e) =>
                            setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))
                          }
                          className="w-full text-xs border-none bg-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border border-green-200 rounded-lg p-6 bg-green-50 shadow-[0_10px_24px_rgba(16,185,129,0.10),0_4px_10px_rgba(16,185,129,0.06)]">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="ready-to-submit"
                    checked={readyToSubmit}
                    onChange={(e) => setReadyToSubmit(e.target.checked)}
                    className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <label htmlFor="ready-to-submit" className="cursor-pointer">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to submit?</h3>
                      <p className="text-sm text-green-800">
                        Save this as draft now and submit for review later from your dashboard.
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Icon as={ChevronLeft} size={16} className="text-gray-700" />
              Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 inline-flex items-center gap-2"
              >
                Next
                <Icon as={ChevronRight} size={16} className="text-white" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSaveExperience}
                  disabled={isSaving || !completion.basicsOk || !completion.detailsOk}
                  className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {readyToSubmit ? 'Submitting...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Icon as={CheckCircle2} size={16} className="text-white" />
                      {readyToSubmit ? 'Submit for Review' : 'Save as Draft'}
                    </>
                  )}
                </button>
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
            </>
          )}

          {/* Preview Card - Centered on screen */}
          <div className="flex justify-center items-start min-h-[calc(100vh-200px)] py-8">
            <div className="w-full" style={{ maxWidth: '400px' }}>
              <ExperiencePreviewCard
                form={form}
                host={currentUser}
                photos={photos}
                onEdit={() => setFormOpen(true)}
                onSubmit={handleSaveExperience}
                onPreview={() => {
                  if (canShowPreview) {
                    setShowPreviewModal(true);
                  } else {
                    toast.error('Please fill in title and description (min 10 and 50 characters) to preview');
                  }
                }}
              />
            </div>
          </div>
        </div>
        )}
        </div>
      </div>

      {/* AI Chat Sidebar - Only show when step > 0, persists across steps */}
      {step > 0 && (
        <AIChatSidebar
          formState={form}
          updateFormState={(updates) => setForm((p) => ({ ...p, ...updates }))}
          currentStep={step}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          messages={chatMessages}
          setMessages={setChatMessages}
        />
      )}

      {/* Experience Preview Modal */}
      {showPreviewModal && (
        <ExperiencePreviewModal
          experience={useMemo(() => normalizeFormState(form, photos as PhotoArray), [form, photos])}
          photos={photos as PhotoArray}
          host={currentUser}
          onClose={() => setShowPreviewModal(false)}
          mode="preview"
        />
      )}
    </div>
  );
}

