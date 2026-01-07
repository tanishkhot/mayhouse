'use client';

import React, { useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react';
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
  Maximize2,
  Minimize2,
  X,
  Plus,
  Map as MapIcon,
  ArrowLeft,
  Eye,
  Save,
} from 'lucide-react';
import { MapPicker, type Waypoint } from '@/components/ui/map-picker';
import Icon from '../ui/icon';
import { DesignExperienceAPI } from '@/lib/design-experience-api';
import { toast } from 'sonner';
import { AIChatSidebar, ChatMessage } from './AIChatSidebar';
import GuidedQAFlow from './GuidedQAFlow';
import GuidedQAIntro from './GuidedQAIntro';
import { experienceAPI } from '@/lib/experience-api';
import { mapFormToExperienceCreate } from '@/lib/experience-mapper';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthAPI, UserResponse, api } from '@/lib/api';
import ExperiencePreviewCard from './ExperiencePreviewCard';
import { ExperiencePreviewModal } from '@/components/experience-preview';
import { normalizeFormState } from '@/lib/experience-preview-normalizer';
import { PhotoArray } from '@/lib/experience-preview-types';
import { mapExperienceResponseToForm } from '@/lib/experience-mapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type FormState = {
  title: string;
  description: string;
  domain: string;
  theme: string;
  duration: number;
  firstEventRunDate?: string;
  firstEventRunTime?: string;
  maxCapacity: number;
  price: string;
  neighborhood: string;
  meetingPoint: string;
  latitude?: number;
  longitude?: number;
  waypoints?: Waypoint[];
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
  firstEventRunDate: '',
  firstEventRunTime: '',
  maxCapacity: 4,
  price: '',
  neighborhood: '',
  meetingPoint: '',
  latitude: undefined,
  longitude: undefined,
  waypoints: [],
  requirements: '',
  whatToExpect: '',
  whatToKnow: '',
  whatToBring: '',
};

export default function DesignExperienceV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [hasMovedToStepOne, setHasMovedToStepOne] = useState(false);
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
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Edit Mode State
  const [experienceId, setExperienceId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingExperience, setIsLoadingExperience] = useState(false);
  
  // Route Planner State
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [activeWaypointId, setActiveWaypointId] = useState<string | null>(null);

  // Initialize waypoints from form data if empty (but not if we're loading from edit mode)
  useEffect(() => {
    // Don't initialize if we're loading an experience (edit mode) or if waypoints already exist
    if (isLoadingExperience) {
      return;
    }
    
    // Only initialize if waypoints are empty and we have coordinates
    // Also check if form.waypoints is empty (to avoid overwriting loaded route_data)
    if (waypoints.length === 0 && 
        (!form.waypoints || form.waypoints.length === 0) &&
        form.latitude && 
        form.longitude) {
      setWaypoints([{
        id: 'start',
        lat: form.latitude,
        lng: form.longitude,
        name: form.meetingPoint || 'Start Point',
        type: 'start'
      }]);
      setActiveWaypointId('start');
    }
  }, [form.latitude, form.longitude, form.meetingPoint, form.waypoints, waypoints.length, isLoadingExperience]); // Only run if form has data and waypoints are empty

  const handleWaypointChange = (location: { lat: number; lng: number; name: string }) => {
    // If no active waypoint or waypoints list is empty, treat as standard meeting point update
    if (!activeWaypointId && waypoints.length === 0) {
       setForm((p) => ({
          ...p,
          meetingPoint: location.name,
          latitude: location.lat,
          longitude: location.lng
        }));
        // Also init waypoints
        const newWaypoints: Waypoint[] = [{
          id: 'start',
          lat: location.lat,
          lng: location.lng,
          name: location.name,
          type: 'start'
        }];
        setWaypoints(newWaypoints);
        // Sync waypoints to form
        setForm(p => ({ ...p, waypoints: newWaypoints }));
        setActiveWaypointId('start');
        return;
    }

    const targetId = activeWaypointId || (waypoints.length > 0 ? waypoints[0].id : 'start');

    const updatedWaypoints = waypoints.map(wp => {
      if (wp.id === targetId) {
        return { ...wp, lat: location.lat, lng: location.lng, name: location.name };
      }
      return wp;
    });

    setWaypoints(updatedWaypoints);
    // Sync waypoints to form
    setForm(p => ({ ...p, waypoints: updatedWaypoints }));

    // If we just updated the start point, sync back to form
    if (targetId === 'start' || (waypoints.find(w => w.id === targetId)?.type === 'start')) {
        setForm((p) => ({
          ...p,
          meetingPoint: location.name,
          latitude: location.lat,
          longitude: location.lng,
          waypoints: updatedWaypoints
        }));
    }
  };

  const addWaypoint = () => {
    const lastPoint = waypoints[waypoints.length - 1];
    // Offset slightly so it doesn't overlap perfectly
    const newLat = lastPoint ? lastPoint.lat + 0.002 : (form.latitude || 19.0760);
    const newLng = lastPoint ? lastPoint.lng + 0.002 : (form.longitude || 72.8777);
    
    const newId = `stop-${Date.now()}`;
    const newWaypoint: Waypoint = {
      id: newId,
      lat: newLat,
      lng: newLng,
      name: 'New Stop',
      type: 'stop'
    };

    setWaypoints(prev => {
        // Ensure the last one is marked as 'end' if we have > 1, but we are appending...
        // Actually, let's keep it simple: Start -> Stop -> Stop -> End.
        // If we add a point, it becomes the new "End" if we want, or just a "Stop".
        // Let's just make them all 'stop' except the first one.
        // Or if we want strictly Start/End semantics:
        // The last one is End. The ones in middle are Stops.
        
        const newWaypoints = [...prev, newWaypoint];
        
        // Fix types
        const updated = newWaypoints.map((wp, idx) => ({
            ...wp,
            type: idx === 0 ? 'start' : (idx === newWaypoints.length - 1 ? 'end' : 'stop')
        })) as Waypoint[];
        
        // Sync to form immediately
        setForm(p => ({ ...p, waypoints: updated }));
        
        return updated;
    });
    
    setActiveWaypointId(newId);
  };

  const removeWaypoint = (id: string) => {
    if (id === 'start') {
        toast.error("Cannot remove the start point (Meeting Point).");
        return;
    }
    setWaypoints(prev => {
        const filtered = prev.filter(w => w.id !== id);
         // Re-assign types
        const updated = filtered.map((wp, idx) => ({
            ...wp,
            type: idx === 0 ? 'start' : (idx === filtered.length - 1 ? 'end' : 'stop')
        })) as Waypoint[];
        
        // Sync to form
        setForm(p => ({ ...p, waypoints: updated }));
        
        return updated;
    });
    if (activeWaypointId === id) {
        setActiveWaypointId('start');
    }
  };

  // Refs for intelligent resizing
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mapContainerStyle, setMapContainerStyle] = useState<React.CSSProperties>({});

  // Intelligent map resizing layout effect
  useLayoutEffect(() => {
    const calculateLayout = () => {
      // Logic:
      // 1. If screen is mobile/small tablet (< 1024px), map is full screen overlay (handled by CSS classes).
      // 2. If screen is desktop (>= 1024px) AND sidebar is open AND map is expanded:
      //    Calculate actual sidebar width and apply as marginLeft to map container.
      //    Map width = 100% - sidebar width.
      
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      
      if (isDesktop && formOpen && isMapExpanded && sidebarRef.current) {
        const sidebarWidth = sidebarRef.current.offsetWidth;
        setMapContainerStyle({
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
        });
      } else {
        // Reset styles for mobile or collapsed states (let CSS classes handle it)
        setMapContainerStyle({});
      }
    };

    // Run on mount, resize, and state changes
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    
    // Also use ResizeObserver for more robust sidebar size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (sidebarRef.current) {
      resizeObserver = new ResizeObserver(calculateLayout);
      resizeObserver.observe(sidebarRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculateLayout);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isMapExpanded, formOpen]);

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

  // Load experience function for edit mode
  const loadExperience = async (expId: string) => {
    setIsLoadingExperience(true);
    try {
      // Fetch experience data
      const experience = await experienceAPI.getExperience(expId);
      
      // Fetch photos
      let experiencePhotos: Array<{ id: string; url: string; isCover: boolean; caption?: string }> = [];
      try {
        const photosResponse = await api.get(`/experiences/${expId}/photos`);
        const photosData = photosResponse.data as Array<{
          id: string;
          photo_url: string;
          is_cover_photo: boolean;
          caption?: string;
        }>;
        experiencePhotos = photosData.map((photo) => ({
          id: photo.id,
          url: photo.photo_url,
          isCover: photo.is_cover_photo,
          caption: photo.caption,
        }));
      } catch (err) {
        console.warn('Could not fetch photos for experience:', err);
        // Continue without photos
      }

      // Map experience to form state
      const formData = mapExperienceResponseToForm(experience);
      
      // Deserialize route_data.waypoints into waypoints state (use mapped formData.waypoints)
      if (formData.waypoints && formData.waypoints.length > 0) {
        setWaypoints(formData.waypoints as Waypoint[]);
        // Set first waypoint as active
        setActiveWaypointId(formData.waypoints[0]?.id || null);
      } else {
        // No route data, initialize empty waypoints
        setWaypoints([]);
        setActiveWaypointId(null);
      }
      
      // Set form state (after waypoints are set to avoid type issues)
      setForm(formData as FormState);
      
      // Set photos
      setPhotos(experiencePhotos);
      
      // Set edit mode state
      setExperienceId(expId);
      setIsEditMode(true);
      
      // Navigate to step 1 (form editing) if we have route data, otherwise stay at current step
      if (experience.route_data?.waypoints && experience.route_data.waypoints.length > 0) {
        setStep(1); // Go to step 1 where route planning is
        setFormOpen(true); // Open the form sidebar
      } else {
        setStep(1);
        setFormOpen(true);
      }
      
      toast.success('Experience loaded for editing');
    } catch (error: any) {
      console.error('Error loading experience:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load experience';
      toast.error(errorMessage);
      // Reset edit mode on error
      setIsEditMode(false);
      setExperienceId(null);
    } finally {
      setIsLoadingExperience(false);
    }
  };

  // Detect edit mode from URL params
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !isEditMode && !isLoadingExperience) {
      loadExperience(editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // Auto-open AI chat and close form panel when moving to step 1 (editing phase)
  useEffect(() => {
    if (step === 1 && !hasMovedToStepOne) {
      setHasMovedToStepOne(true);
      setChatOpen(true); // Open AI chat by default
      setFormOpen(false); // Keep form panel closed
      
      // Add a welcoming message to guide the user
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-welcome-${Date.now()}`,
          role: 'assistant',
          content: "Great start! I can see your experience is taking shape. I'm here to help you refine it. You can:\n\n• Ask me to improve any section\n• Request changes to specific fields\n• Get suggestions for better descriptions\n• Or just chat naturally about what you want to change\n\nWhat would you like to work on first?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [step, hasMovedToStepOne]);

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
      // Get current user for host_id (needed for update)
      const user = currentUser || await AuthAPI.me();
      if (!user || !user.id) {
        toast.error('User authentication required');
        return null;
      }

      // Create a copy of form data and ensure waypoints are included
      // If waypoints exist in component state but not in form (sync issue), use component state
      const finalFormData = {
        ...formData,
        waypoints: formData.waypoints && formData.waypoints.length > 0 
          ? formData.waypoints 
          : waypoints // Use local state if form prop is empty
      };

      // Map form data to ExperienceCreate format (works for both create and update)
      const experienceData = mapFormToExperienceCreate(finalFormData);

      let savedExperience;
      
      // Check if we're in edit mode
      if (isEditMode && experienceId) {
        // Update existing experience
        // Convert ExperienceCreate to ExperienceUpdate (all fields optional)
        const updateData: any = {
          title: experienceData.title,
          promise: experienceData.promise,
          description: experienceData.description,
          unique_element: experienceData.unique_element,
          host_story: experienceData.host_story,
          experience_domain: experienceData.experience_domain,
          experience_theme: experienceData.experience_theme,
          country: experienceData.country,
          city: experienceData.city,
          neighborhood: experienceData.neighborhood,
          meeting_landmark: experienceData.meeting_landmark,
          meeting_point_details: experienceData.meeting_point_details,
          latitude: experienceData.latitude,
          longitude: experienceData.longitude,
          route_data: experienceData.route_data,
          duration_minutes: experienceData.duration_minutes,
          traveler_min_capacity: experienceData.traveler_min_capacity,
          traveler_max_capacity: experienceData.traveler_max_capacity,
          price_inr: experienceData.price_inr,
          inclusions: experienceData.inclusions,
          traveler_should_bring: experienceData.traveler_should_bring,
          accessibility_notes: experienceData.accessibility_notes,
          weather_contingency_plan: experienceData.weather_contingency_plan,
          photo_sharing_consent_required: experienceData.photo_sharing_consent_required,
          experience_safety_guidelines: experienceData.experience_safety_guidelines,
        };

        savedExperience = await experienceAPI.updateExperience(experienceId, updateData, user.id);

        if (showSuccessToast) {
          toast.success('Experience updated!');
        }
      } else {
        // Create new experience
        savedExperience = await experienceAPI.createExperience(experienceData);

        if (showSuccessToast) {
          toast.success('Experience saved as draft!');
        }
        
        // Set experienceId for future updates
        if (savedExperience?.id) {
          setExperienceId(savedExperience.id);
          setIsEditMode(true);
        }
      }
      
      if (redirect) {
        // Redirect to host dashboard
        router.push('/host-dashboard');
      }
      
      return savedExperience;
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
    const savedExperience = await saveExperienceFromData(form, true, true);
    
    // If ready to submit and experience was saved, submit for review
    if (readyToSubmit && savedExperience?.id) {
      try {
        const user = currentUser || await AuthAPI.me();
        if (!user || !user.id) {
          toast.error('User authentication required');
          return;
        }

        await api.post(`/experiences/${savedExperience.id}/submit`, {
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

  // Calculate preview data at top level to avoid conditional hook usage
  const previewExperience = useMemo(() => normalizeFormState(form, photos as PhotoArray), [form, photos]);

  const fieldClasses = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-black focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:ring-terracotta-500 focus:border-terracotta-500'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sticky header for step > 0 */}
      {step > 0 && (
        <div className="border-b bg-white/50 backdrop-blur sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/host-dashboard">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-medium">Design Your Experience</h1>
                  <p className="text-sm text-muted-foreground">Manual Entry</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveExperience} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                {canShowPreview && (
                  <Button
                    size="sm"
                    onClick={() => setShowPreviewModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChatOpen(!chatOpen)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {chatOpen ? 'Hide' : 'Show'} Assistant
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header for step 0 */}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Step 0 content */}
        {step === 0 && (
          <div className="max-w-4xl mx-auto">
          {/* Step 0 - Kickstart choices */}
          {mode === 'kickstart' && (
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
                    Tell us in your own words. We'll handle the structure.
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
                    We'll ask specific questions to build your listing.
                  </div>
                </button>
              </div>

              <div className="text-center pt-4">
                <button 
                  onClick={() => {
                    setStep(1);
                    setFormOpen(true);
                  }} 
                  className="text-sm text-black/70 underline"
                >
                  Start from scratch instead
                </button>
              </div>
            </div>
          )}

          {/* Step 0.A - Describe Your Experience */}
          {mode === 'describe' && (
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
          {mode === 'guided' && !hasStartedGuidedFlow && (
            <GuidedQAIntro
              onStart={() => setHasStartedGuidedFlow(true)}
              onCancel={() => {
                setMode('kickstart');
                setHasStartedGuidedFlow(false);
              }}
            />
          )}

          {/* Step 0.C - Guided Questions Flow */}
          {mode === 'guided' && hasStartedGuidedFlow && (
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
        </div>
        )}

        {/* Step > 0 - Form and Chat Grid Layout */}
        {step > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form Area - 2/3 width when chat open, full width when closed */}
            <div className={`${chatOpen ? 'lg:col-span-2' : 'lg:col-span-3 max-w-4xl mx-auto'}`}>
              <div className="space-y-6">
                {/* Step 1 - Basic Information */}
                {step === 1 && (
                  <Card className="p-6">
                    <h2 className="text-xl mb-6 pb-4 border-b">Basic Information</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-black mb-2">
                          Experience Title <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                          maxLength={2000}
                          placeholder="e.g., Mumbai Street Food Adventure with Local Guide"
                          className={fieldClasses(form.title.trim().length > 0 && form.title.trim().length < 10)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {form.title.length}/10+ characters (minimum 10 recommended)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-black mb-2">
                          Description <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                          maxLength={2000}
                          rows={4}
                          placeholder="Describe what makes your experience unique and exciting..."
                          className={fieldClasses(form.description.trim().length > 0 && form.description.trim().length < 100)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {form.description.length}/2000 characters (minimum 100 recommended)
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-black mb-2">
                            Category <span className="text-destructive">*</span>
                          </label>
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
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-black mb-2">
                            Duration (minutes) <span className="text-destructive">*</span>
                          </label>
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

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-black mb-2">
                            Proposed first run date (optional)
                          </label>
                          <input
                            type="date"
                            value={form.firstEventRunDate || ''}
                            onChange={(e) => setForm((p) => ({ ...p, firstEventRunDate: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                          />
                          <p className="text-xs text-muted-foreground">
                            We will use this to prefill scheduling after approval.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-black mb-2">
                            Proposed first run start time (optional)
                          </label>
                          <input
                            type="time"
                            value={form.firstEventRunTime || ''}
                            onChange={(e) => setForm((p) => ({ ...p, firstEventRunTime: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                          />
                          <p className="text-xs text-muted-foreground">
                            This is only a suggestion. You can change it later.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Step 2 - Experience Details */}
                {step === 2 && (
                  <Card className="p-6">
                    <h2 className="text-xl mb-6 pb-4 border-b">Experience Details</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="max-capacity" className="block text-sm font-medium text-black mb-2">Max Participants *</label>
                          <input
                            id="max-capacity"
                            type="number"
                            value={form.maxCapacity}
                            onChange={(e) => setForm((p) => ({ ...p, maxCapacity: parseInt(e.target.value || '1', 10) }))}
                            min={1}
                            max={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-black mb-2">Price per Person (₹) *</label>
                          <input
                            id="price"
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
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-black">
                            <Icon as={MapPin} size={16} className="text-terracotta-600" />
                            <span>Meeting Point *</span>
                          </label>
                          <button
                            onClick={() => setIsMapExpanded(!isMapExpanded)}
                            className="text-xs text-terracotta-600 hover:text-terracotta-700 flex items-center font-medium"
                          >
                            {isMapExpanded ? (
                              <>
                                <Icon as={Minimize2} size={12} className="mr-1" /> Collapse Map
                              </>
                            ) : (
                              <>
                                <Icon as={Maximize2} size={12} className="mr-1" /> Expand Map
                              </>
                            )}
                          </button>
                        </div>
                        <div className="space-y-4">
                          {/* Map Container */}
                          <div className="h-[350px] w-full rounded-lg overflow-hidden border border-gray-200 relative">
                            <MapPicker
                              value={
                                activeWaypointId 
                                  ? waypoints.find(w => w.id === activeWaypointId)
                                  : (form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude, name: form.meetingPoint } : undefined)
                              }
                              onChange={handleWaypointChange}
                              height="100%"
                              routeWaypoints={waypoints}
                              activeWaypointIndex={waypoints.findIndex(w => w.id === activeWaypointId)}
                            />
                            
                            {/* Active Stop Indicator Overlay */}
                            {activeWaypointId && waypoints.length > 0 && (
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-gray-200 text-terracotta-600">
                                Editing: {waypoints.find(w => w.id === activeWaypointId)?.name || 'Selected Stop'}
                              </div>
                            )}
                          </div>

                          {/* ROUTE PLANNING CONTROLS */}
                          {waypoints.length === 0 ? (
                            /* 1. Big "Plan a Route" Button */
                            <button
                              onClick={() => {
                                // Initialize route with current meeting point as start
                                const startPoint = {
                                    id: 'start',
                                    lat: form.latitude || 19.0760,
                                    lng: form.longitude || 72.8777,
                                    name: form.meetingPoint || 'Meeting Point',
                                    type: 'start' as const
                                };
                                setWaypoints([startPoint]);
                                setActiveWaypointId('start');
                                toast.info("Route planning started! Add stops to create a path.");
                              }}
                              className="w-full py-4 bg-white border-2 border-dashed border-terracotta-200 rounded-xl text-terracotta-600 font-medium hover:bg-terracotta-50 hover:border-terracotta-300 transition-all flex items-center justify-center gap-2 group"
                            >
                              <div className="p-2 bg-terracotta-100 rounded-full group-hover:bg-terracotta-200 transition-colors">
                                <Icon as={MapIcon} size={20} className="text-terracotta-600" />
                              </div>
                              <span>Plan a Walking Route with Multiple Stops</span>
                            </button>
                          ) : (
                            /* 2. Active Route List */
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">Your Route</h4>
                                  <p className="text-xs text-gray-500">{waypoints.length} stops • Click a stop to search/edit location</p>
                                </div>
                                <button 
                                  onClick={addWaypoint} 
                                  className="px-3 py-1.5 bg-terracotta-500 text-white text-xs font-medium rounded-lg hover:bg-terracotta-600 flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <Icon as={Plus} size={14} /> Add Stop
                                </button>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                                {waypoints.map((wp, index) => (
                                  <div 
                                    key={wp.id}
                                    onClick={() => setActiveWaypointId(wp.id)}
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all ${
                                      activeWaypointId === wp.id 
                                        ? 'bg-terracotta-50 border-l-4 border-l-terracotta-500 pl-3' 
                                        : 'hover:bg-gray-50 border-l-4 border-l-transparent pl-3'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${
                                        wp.type === 'start' ? 'bg-green-500' : wp.type === 'end' ? 'bg-red-500' : 'bg-blue-500'
                                      }`}>
                                        {index + 1}
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${activeWaypointId === wp.id ? 'text-terracotta-900' : 'text-gray-700'}`}>
                                          {wp.name || `Stop ${index + 1}`}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{wp.type}</p>
                                      </div>
                                    </div>
                                    {wp.type !== 'start' && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); removeWaypoint(wp.id); }}
                                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        title="Remove Stop"
                                      >
                                        <Icon as={Trash2} size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Meeting Point Input (Synced with Start) */}
                          <div>
                            <input
                              type="text"
                              value={form.meetingPoint}
                              onChange={(e) => {
                                  setForm((p) => ({ ...p, meetingPoint: e.target.value }));
                                  // Sync with start point in route
                                  if (waypoints.length > 0) {
                                     setWaypoints(prev => prev.map(w => w.id === 'start' ? { ...w, name: e.target.value } : w));
                                  }
                              }}
                              maxLength={2000}
                              placeholder="e.g., Gateway of India, Main Entrance"
                              className={fieldClasses(form.meetingPoint.trim().length === 0)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {waypoints.length > 0 
                                ? "This is your Start Point (Stop 1). Edit it here or select it in the list above to search on the map."
                                : "The first point (Meeting Point) is where you will meet your guests."}
                            </p>
                          </div>
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
                  </Card>
                )}

                {/* Step 3 - Additional Information */}
                {step === 3 && (
                  <Card className="p-6">
                    <h2 className="text-xl mb-6 pb-4 border-b">Additional Information</h2>
                    <div className="space-y-6">
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
                  </Card>
                )}

                {/* Step 4 - Photos & Final Review */}
                {step === 4 && (
                  <Card className="p-6">
                    <h2 className="text-xl mb-6 pb-4 border-b">Photos & Final Review</h2>
                    <div className="space-y-6">
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
                  </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  {step < 4 ? (
                    <Button
                      onClick={() => setStep((s) => Math.min(4, s + 1))}
                      className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveExperience}
                        disabled={isSaving || !completion.basicsOk || !completion.detailsOk}
                        className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {readyToSubmit ? 'Submitting...' : isEditMode ? 'Updating...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {readyToSubmit ? 'Submit for Review' : isEditMode ? 'Update Experience' : 'Save as Draft'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Chat Sidebar - 1/3 width, sticky */}
            {chatOpen && (
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <AIChatSidebar
                    formState={form}
                    updateFormState={(updates) => setForm((p) => ({ ...p, ...updates }))}
                    currentStep={step}
                    isOpen={chatOpen}
                    onToggle={() => setChatOpen(!chatOpen)}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experience Preview Modal */}
      {showPreviewModal && (
        <ExperiencePreviewModal
          experience={previewExperience}
          photos={photos as PhotoArray}
          host={currentUser}
          onClose={() => setShowPreviewModal(false)}
          mode="preview"
        />
      )}
    </div>
  );
}

