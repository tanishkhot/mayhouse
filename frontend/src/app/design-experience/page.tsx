'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HostOnlyRoute } from '@/components/ProtectedRoute';
import { DesignExperienceSkeleton } from '@/components/skeletons';
import { api } from '@/lib/api';
import { ExperiencePhotoUpload } from '@/components/ExperiencePhotoUpload';

type ExperienceFormState = {
  title: string;
  description: string;
  domain: string;
  theme: string;
  duration: number;
  maxCapacity: number;
  price: string;
  neighborhood: string;
  meetingPoint: string;
  requirements: string;
  whatToExpect: string;
  whatToKnow: string;
  whatToBring: string;
};

interface ExperiencePhoto {
  id: string;
  photo_url: string;
  is_cover_photo: boolean;
  display_order: number;
  caption?: string;
  uploaded_at?: string;
}

const INITIAL_FORM_DATA: ExperienceFormState = {
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
};

const TEST_EXPERIENCE_TEMPLATES: Array<{ form: ExperienceFormState; imageUrl: string }> = [
  {
    form: {
      title: 'Old Town Dawn Walk & Chai Stories',
      description:
        'Begin your morning with an intimate walk through Mumbai’s historic lanes as the city slowly wakes up. We will visit the flower market, taste steaming chai with spice vendors, and listen to stories about the original dock workers who built this neighborhood. Expect the smell of fresh jasmine, temple bells echoing through narrow alleys, and plenty of personal anecdotes from my family who has lived here for generations.',
      domain: 'culture',
      theme: 'Morning Heritage Trails',
      duration: 150,
      maxCapacity: 4,
      price: '2200',
      neighborhood: 'Fort & Colaba',
      meetingPoint: 'Gateway of India, main arch',
      requirements: 'Comfortable walking shoes recommended; moderate walking pace.',
      whatToExpect:
        'Witness Mumbai’s oldest markets come alive at sunrise, meet the families who still run century-old stalls, and enjoy a private chai tasting while listening to intimate neighborhood stories passed down to me.',
      whatToKnow:
        'Tour runs rain or shine. We finish near Kala Ghoda for breakfast options. Light snacks included, please bring a reusable bottle.',
      whatToBring: 'Camera, reusable water bottle, light jacket for early mornings.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Midnight Mills & Textile Tales',
      description:
        'Explore Mumbai’s mill district after dark with former textile workers. We slip into abandoned courtyards, hear union stories in the old cafeteria, and end with Irani chai while reading from original wage ledgers my family preserved.',
      domain: 'history',
      theme: 'Industrial Heritage Nights',
      duration: 150,
      maxCapacity: 6,
      price: '2500',
      neighborhood: 'Lower Parel',
      meetingPoint: 'Shakti Mills security gate',
      requirements: 'Wear closed shoes; light jacket recommended for night breeze.',
      whatToExpect:
        'Industrial landscapes under moonlight, insider access to a mill floor, personal union anecdotes, and a curated playlist of archival mill songs.',
      whatToKnow:
        'Security escort provided. Photographs allowed only at marked zones. Moderate walking over uneven surfaces.',
      whatToBring: 'Government ID, small flashlight (phone acceptable).',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1517350461416-43c0db9fb0c7?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Seafront Stories & Koli Breakfast',
      description:
        'Join my Koli family as we welcome the morning tide at Worli. You will watch nets being cast, learn a folk song that calls the fish, and share a traditional breakfast in our community kitchen while elders recount sea legends.',
      domain: 'culture',
      theme: 'Coastal Community Immersions',
      duration: 180,
      maxCapacity: 5,
      price: '2800',
      neighborhood: 'Worli Gaon',
      meetingPoint: 'Worli Fort entrance',
      requirements: 'Comfortable footwear that can get wet; basic balance over stones.',
      whatToExpect:
        'Hands-on net throwing session, exclusive access to tide-watching deck, storytelling circle with elders, and a seasonal seafood breakfast.',
      whatToKnow:
        'Tour timed to tide charts; reschedules offered during cyclonic alerts. Vegetarian alternative available on request.',
      whatToBring: 'Hat, sunscreen, reusable bottle, optional motion-sickness aid.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1452075758390-0474c4dd5538?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Art Deco Twilight Walk',
      description:
        'Decode Marine Drive’s UNESCO-listed Art Deco skyline as the sun sets. As a preservation architect, I will show original blueprints, rooftop vistas, and hidden motifs that most city residents never notice.',
      domain: 'architecture',
      theme: 'Sunset Skyline Stories',
      duration: 150,
      maxCapacity: 8,
      price: '2000',
      neighborhood: 'Marine Drive & Oval Maidan',
      meetingPoint: 'Churchgate Station (west exit)',
      requirements: 'Light walking; elevator access to rooftops.',
      whatToExpect:
        'Interior tour of Regal Cinema, vintage elevator ride, design sketch mini-workshop, and a Deco-inspired mocktail at a historic café.',
      whatToKnow:
        'Wheelchair-friendly path; rooftop access subject to weather. Tour concludes near Art Deco cafés for optional dinner.',
      whatToBring: 'Camera, light shawl for sea breeze.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1542370285-b8eb8317691f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Chor Bazaar Treasure Hunt',
      description:
        'Scour Chor Bazaar with the grandson of a 1940s antique trader. Learn bargaining rituals, meet restorers, and gain access to our family’s hidden warehouse with stories behind every piece.',
      domain: 'culture',
      theme: 'Market Narratives & Collectibles',
      duration: 180,
      maxCapacity: 6,
      price: '1900',
      neighborhood: 'Chor Bazaar',
      meetingPoint: 'Minara Masjid corner',
      requirements: 'Comfortable sandals; keep valuables secure.',
      whatToExpect:
        'Hands-on negotiation coaching, lamp restoration demo, Sulemani chai with traders, and a curated list of trustworthy vendors.',
      whatToKnow:
        'Cash preferred for purchases. Tour operates except on major religious holidays when shops close.',
      whatToBring: 'Tote bag, small bills for purchases.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1506242395783-2e70b6b9c577?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Bandra Graffiti Nights',
      description:
        'Walk Bandra’s dynamic street-art corridors after dusk with a curator who has commissioned many murals. Meet an artist on-site, paint a collaborative stencil, and end at a pop-up rooftop gallery with the scene’s insiders.',
      domain: 'art',
      theme: 'Urban Art Immersions',
      duration: 150,
      maxCapacity: 10,
      price: '2400',
      neighborhood: 'Bandra (West)',
      meetingPoint: 'St. Andrew’s Church steps',
      requirements: 'Wear clothes that can get paint on them.',
      whatToExpect:
        'Guided mural decoding, insider anecdotes about gentrification, live stencil workshop, and craft beer / mocktail at a rooftop gallery.',
      whatToKnow:
        'All paint permissions secured. Masks provided for spray work. Accessible detour available for stair sections.',
      whatToBring: 'Optional sketchbook, curiosity for color.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1497536194212-77674a5c0f0c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Modkhana Heritage Walk',
      description:
        'Trace Girgaon’s sweet traditions with my extended family who run the neighborhood’s modkhana. Watch artisans sculpt idols, taste steaming ukadiche modak, and hear the spiritual lore behind each lane.',
      domain: 'food',
      theme: 'Festival & Faith Trails',
      duration: 180,
      maxCapacity: 5,
      price: '1800',
      neighborhood: 'Girgaon',
      meetingPoint: 'Charni Road (east) outside station',
      requirements: 'Short bursts of stair climbing in heritage buildings.',
      whatToExpect:
        'Live modak shaping class, visit to community shrine, oral mythology from mandal historians, and curated photo archive viewing.',
      whatToKnow:
        'Peak experience during Ganesh Chaturthi; off-season walk focuses on year-round artisans. Vegetarian and dairy-inclusive.',
      whatToBring: 'Appetite and respect for shrines (cover shoulders).',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1516214104705-6b4e4e663b1a?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Matunga Filter Coffee Trail',
      description:
        'Taste the evolution of Matunga’s iconic filter coffees with a third-generation café owner. Learn bean roasting, brew your own tumbler, and explore migration stories that shaped this South-Indian enclave.',
      domain: 'food',
      theme: 'Café Culture Walks',
      duration: 150,
      maxCapacity: 6,
      price: '1600',
      neighborhood: 'Matunga',
      meetingPoint: 'Matunga station (west) concourse',
      requirements: 'Light walking; mostly flat terrain.',
      whatToExpect:
        'Roastery floor visit, filter brewing workshop, temple architecture snippets, and breakfast platter featuring dosa, idli, and sweets.',
      whatToKnow:
        'Vegetarian friendly; gluten-free options with prior notice. Tour ends near King’s Circle for onward exploration.',
      whatToBring: 'Minimal—everything served fresh. Optional reusable cup.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Queer History After Hours',
      description:
        'Walk Mumbai’s queer archives with community historians. We visit hidden safe spaces, discuss landmark court cases, create a zine page together, and end with poetry readings under the Kala Ghoda banyans.',
      domain: 'culture',
      theme: 'Community & Identity Walks',
      duration: 150,
      maxCapacity: 12,
      price: '2100',
      neighborhood: 'Fort & Kala Ghoda',
      meetingPoint: 'Asiatic Library steps',
      requirements: 'Inclusive environment—respectful participation essential.',
      whatToExpect:
        'Archive interaction, safe-space café visit, live spoken word performance, and collaborative zine-making session guided by activists.',
      whatToKnow:
        'Wheelchair-accessible plan provided. Optional donation to archive. Neutral pronoun badges offered on arrival.',
      whatToBring: 'Open mind, optional art supplies for zine.',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1499540633125-484965b60031?auto=format&fit=crop&w=1400&q=80',
  },
  {
    form: {
      title: 'Salt Pan Sundown Walk',
      description:
        'Witness flamingos feeding on the Airoli wetlands from my family’s salt pan boat. Hear stories of salt-worker resilience, sketch the sunset, and savor home-made banana fritters with warming chai.',
      domain: 'nature',
      theme: 'Wetland & Wildlife Immersions',
      duration: 165,
      maxCapacity: 6,
      price: '2300',
      neighborhood: 'Airoli',
      meetingPoint: 'Airoli jetty',
      requirements: 'Comfortable shoes; minor balance boarding boat.',
      whatToExpect:
        'Boat ride across salt pans, flamingo spotting with naturalist, salt harvesting demonstration, and guided sunset sketch circle.',
      whatToKnow:
        'Seasonal sightings (Nov–March best). Alternate mangrove exploration offered when flamingos migrate.',
      whatToBring: 'Hat, sunscreen, binoculars (loaners limited).',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  },
];

// Test constants for development
const TEST_EXPERIENCE_FORM: ExperienceFormState = TEST_EXPERIENCE_TEMPLATES[0]?.form || {
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
};

const TEST_EXPERIENCE_IMAGE_URL = TEST_EXPERIENCE_TEMPLATES[0]?.imageUrl || 'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1400&q=80';

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
  const [formData, setFormData] = useState<ExperienceFormState>(INITIAL_FORM_DATA);
  const [createdExperienceId, setCreatedExperienceId] = useState<string | null>(null);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const [initialPhotos, setInitialPhotos] = useState<ExperiencePhoto[]>([]);
  const [isAutoBuilding, setIsAutoBuilding] = useState(false);

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

      try {
        const photosResponse = await api.get(`/experiences/${id}/photos`);
        setInitialPhotos(photosResponse.data || []);
      } catch (photoError) {
        console.error('Error fetching experience photos:', photoError);
        setInitialPhotos([]);
      }

      setCreatedExperienceId(id);
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

  const uploadTestPhoto = async (experienceId: string): Promise<ExperiencePhoto[] | null> => {
    try {
      const imageUrl = TEST_EXPERIENCE_TEMPLATES[0]?.imageUrl || 'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1400&q=80';
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sample image (${response.status})`);
      }

      const blob = await response.blob();
      const fileName = 'mayhouse-test-experience.jpg';
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('is_cover_photo', 'true');
      formDataUpload.append('display_order', '0');

      await api.post(`/experiences/${experienceId}/photos`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const photosResponse = await api.get(`/experiences/${experienceId}/photos`);
      return photosResponse.data || [];
    } catch (error) {
      console.error('Error uploading test photo:', error);
      alert('Test experience created, but uploading the sample photo failed. You can add one manually.');
      return null;
    }
  };

  const buildTestExperience = async () => {
    if (isEditMode || isAutoBuilding) {
      return;
    }

    setIsAutoBuilding(true);
    setFieldErrors({});
    setSubmitForReview(false);
    setInitialPhotos([]);
    setFormData({ ...TEST_EXPERIENCE_FORM });

    try {
      const experienceId = await handleSubmit(TEST_EXPERIENCE_FORM);
      if (!experienceId) {
        return;
      }

      const photos = await uploadTestPhoto(experienceId);
      if (photos) {
        setInitialPhotos(photos);
      }

      setCreatedExperienceId(experienceId);
      setStep(4);
    } catch (error) {
      console.error('Error building test experience:', error);
      alert('Failed to auto-build the test experience. Please try again.');
    } finally {
      setIsAutoBuilding(false);
    }
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

  const handleSubmit = async (dataOverride?: ExperienceFormState): Promise<string | null> => {
    const submissionData = dataOverride ?? formData;

    // Validate all fields
    const { isValid, errors } = validateAllFields(submissionData);
    if (!isValid) {
      const errorMessages = Object.values(errors).filter(Boolean);
      alert('Please fix the following issues:\n\n' + errorMessages.join('\n'));
      return null;
    }

    const actionText = isEditMode ? 'updating' : 'creating';
    console.log(`📝 FORM: Starting experience ${actionText}...`);
    console.log('📝 FORM: Form data:', submissionData);
    console.log('📝 FORM: Edit mode:', isEditMode);
    console.log('📝 FORM: Experience ID:', experienceId);
    
    setIsSubmitting(true);
    
    try {
      // Create the experience payload matching backend schema
      const experienceData = {
        title: submissionData.title,
        promise: submissionData.description.substring(0, 200), // Use first 200 chars of description as promise
        description: submissionData.description,
        unique_element: submissionData.whatToExpect || `This ${submissionData.domain} experience offers authentic local insights and memorable moments.`,
        host_story: `As a passionate local guide, I created this ${submissionData.domain} experience to share the authentic side of Mumbai with travelers.`,
        experience_domain: submissionData.domain,
        experience_theme: submissionData.theme,
        neighborhood: submissionData.neighborhood,
        meeting_landmark: submissionData.meetingPoint.split(',')[0] || submissionData.meetingPoint, // Extract landmark from meeting point
        meeting_point_details: submissionData.meetingPoint,
        duration_minutes: submissionData.duration,
        traveler_max_capacity: submissionData.maxCapacity,
        price_inr: parseFloat(submissionData.price),
        inclusions: ['Professional local guide', 'All activities mentioned in description'],
        traveler_should_bring: submissionData.whatToBring ? [submissionData.whatToBring] : ['Comfortable walking shoes', 'Camera (optional)'],
        accessibility_notes: submissionData.requirements ? [submissionData.requirements] : [],
        experience_safety_guidelines: submissionData.whatToKnow
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
        return null;
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

      if (isEditMode) {
        if (result?.id) {
          setCreatedExperienceId(result.id);
        }
        alert('Experience updated successfully! You can now submit it for review again from your dashboard.');
        router.push('/host-dashboard');
        return result?.id || null;
      }

      if (result?.id) {
        setCreatedExperienceId(result.id);
        setInitialPhotos([]);
        setStep(4);
      }

      return result?.id || null;
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
      return null;
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
  const validateAllFields = (data: ExperienceFormState = formData) => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(field => {
      const value = (data as Record<string, unknown>)[field];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return { isValid: !hasErrors, errors };
  };

  // Show loading state while fetching experience data
  if (isLoading) {
    return (
      <HostOnlyRoute skeleton={<DesignExperienceSkeleton />}>
        <DesignExperienceSkeleton />
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
              {!isEditMode && (
                <button
                  onClick={buildTestExperience}
                  disabled={isSubmitting || isAutoBuilding}
                  className="rounded-full bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/80 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAutoBuilding ? 'Building…' : 'Build test experience'}
                </button>
              )}
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
                      existingPhotos={initialPhotos.map(photo => ({ ...photo, uploaded_at: photo.uploaded_at || new Date().toISOString() }))}
                      onPhotosUpdate={(photos) => setInitialPhotos(photos.map(({ uploaded_at, ...rest }) => rest as ExperiencePhoto))}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Please save your experience first to upload photos
                      </p>
                      <button
                        onClick={() => handleSubmit()}
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
    <HostOnlyRoute skeleton={<DesignExperienceSkeleton />}>
      <Suspense fallback={<DesignExperienceSkeleton />}>
        <DesignExperienceContent />
      </Suspense>
    </HostOnlyRoute>
  );
};

export default DesignExperiencePage;