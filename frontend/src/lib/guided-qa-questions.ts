/**
 * Guided Q&A Questions Configuration
 * 
 * Questions for the "Let's Build Together" flow in experience creation.
 * Each question maps to specific experience fields that will be extracted by AI.
 */

export interface QAQuestionField {
  name: string;
  label: string;
  min?: number;
  max?: number;
  default?: number | null;
}

export interface QAQuestion {
  id: string;
  order: number;
  question: string;
  placeholder: string;
  tip?: string;
  example?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  type: 'textarea' | 'number' | 'photo';
  extractsTo: string[];
  fields?: QAQuestionField[]; // For structured questions (like Q7)
  minPhotos?: number;
  maxPhotos?: number;
}

export const GUIDED_QA_QUESTIONS: QAQuestion[] = [
  {
    id: "q1",
    order: 1,
    question: "What's the main experience you want to share? Tell us about it - what makes it special, where it happens, and what travelers will experience.",
    placeholder: "Example: A sunset heritage walk through old Bangalore markets where we discover century-old spice merchants, family-run sweet shops, and hidden temples. Travelers will learn about local traditions, taste authentic flavors, and hear stories passed down through generations...",
    tip: "Be descriptive! Include what makes your experience unique, the location, and what travelers will do.",
    example: "I want to host a cooking class in my home where we make traditional Karnataka breakfast items like dosas, idlis, and chutneys. I'll share family recipes passed down three generations, and we'll shop for fresh ingredients at the local market first. Perfect for food lovers who want hands-on experience.",
    required: true,
    minLength: 50,
    maxLength: 2000,
    type: "textarea",
    extractsTo: ["title", "promise", "description", "experience_domain", "unique_element", "neighborhood"]
  },
  {
    id: "q2",
    order: 2,
    question: "Where exactly does this experience take place? Describe the meeting point and how travelers will find you.",
    placeholder: "Example: We meet at the Gateway of India main entrance. I'll be wearing a red Mayhouse cap and carrying a professional camera bag. From there, we'll walk through Colaba Causeway to explore hidden street food gems...",
    tip: "Be specific! Include a well-known landmark and detailed instructions for finding you.",
    example: "We meet at Bandra-Worli Sea Link Viewpoint, near the main entrance. I'll be wearing a red Mayhouse cap and carrying a professional camera bag. Look for someone with a Mayhouse logo. From there, we'll walk to nearby alleys to discover street art.",
    required: true,
    minLength: 30,
    maxLength: 1000,
    type: "textarea",
    extractsTo: ["meeting_landmark", "meeting_point_details", "neighborhood", "city"]
  },
  {
    id: "q3",
    order: 3,
    question: "What makes this experience truly unique? What's the one thing travelers can't get anywhere else?",
    placeholder: "Example: Unlike typical food tours, we actually visit the homes of local families who've been making these recipes for generations. You'll learn secret techniques passed down through families and hear personal stories behind each dish...",
    tip: "Focus on what sets your experience apart. What's the unique value proposition?",
    example: "Unlike typical street food tours, we actually meet the street artists who created the murals. You'll hear their stories, learn about their inspiration, and even watch them work on new pieces. This is insider access you can't get on your own.",
    required: true,
    minLength: 50,
    maxLength: 1000,
    type: "textarea",
    extractsTo: ["unique_element", "description"]
  },
  {
    id: "q4",
    order: 4,
    question: "Tell us your story - why are you hosting this experience? What's your personal connection to it?",
    placeholder: "Example: I've been a food blogger in Mumbai for 8 years, but my real passion started in my grandmother's kitchen. She taught me recipes that have been in our family for three generations. I want to share not just the food, but the stories and traditions behind it...",
    tip: "Share your personal connection. Why are you the right person to host this?",
    example: "I've been a street artist in Mumbai for over 8 years and have been part of the local art community. I've watched these murals evolve and know the artists personally. I want to share not just the art, but the stories and community behind it.",
    required: true,
    minLength: 50,
    maxLength: 1000,
    type: "textarea",
    extractsTo: ["host_story", "unique_element"]
  },
  {
    id: "q5",
    order: 5,
    question: "What's included in the experience? What should travelers bring? Any requirements or things they should know?",
    placeholder: "Example: Included: All food tastings (8-10 dishes), local guide, cultural insights, photo opportunities. Bring: Comfortable walking shoes, appetite for adventure, camera (optional). Requirements: Age 12+, moderate walking (2km), no dietary restrictions needed as we can accommodate...",
    tip: "Be clear about what's included, what to bring, and any age/fitness requirements.",
    example: "Included: All food tastings (8-10 dishes), local guide, cultural insights, photo opportunities. Bring: Comfortable walking shoes, appetite for adventure, camera (optional). Requirements: Age 12+, moderate walking (2km), no dietary restrictions needed as we can accommodate.",
    required: true,
    minLength: 30,
    maxLength: 1500,
    type: "textarea",
    extractsTo: ["inclusions", "traveler_should_bring", "accessibility_notes", "requirements"]
  },
  {
    id: "q6",
    order: 6,
    question: "Any safety guidelines, weather considerations, or important logistics travelers should know?",
    placeholder: "Example: Safety: We stay in well-lit areas, follow traffic rules, and maintain group cohesion. Weather: If it rains, we have covered indoor alternatives at local cafes. Cancellation: Full refund if canceled 24 hours before. The experience involves moderate walking on uneven surfaces...",
    tip: "Think about safety, weather backup plans, cancellation policies, and any physical requirements.",
    example: "Safety: We stay in well-lit areas, follow traffic rules, and maintain group cohesion. Weather: If it rains, we have covered indoor alternatives at local cafes. Cancellation: Full refund if canceled 24 hours before. The experience involves moderate walking on uneven surfaces.",
    required: false,
    minLength: 20,
    maxLength: 1500,
    type: "textarea",
    extractsTo: ["experience_safety_guidelines", "weather_contingency_plan"]
  },
  {
    id: "q7",
    order: 7,
    question: "Final details - How long is the experience? How many travelers can join? What's your price per person?",
    placeholder: "Duration: 180 minutes (3 hours)\nMax travelers: 4\nPrice: ₹2000 per person",
    tip: "Duration: 30 minutes to 8 hours. Capacity: 1-4 travelers for intimate experiences.",
    example: "Duration: 180 minutes (3 hours)\nMax travelers: 4\nPrice: ₹2000 per person",
    required: true,
    type: "number",
    extractsTo: ["duration_minutes", "traveler_max_capacity", "price_inr"],
    fields: [
      { name: "duration_minutes", label: "Duration (minutes)", min: 30, max: 480, default: 180 },
      { name: "traveler_max_capacity", label: "Max travelers", min: 1, max: 4, default: 4 },
      { name: "price_inr", label: "Price per person (₹)", min: 0, default: null }
    ]
  },
  {
    id: "q8",
    order: 8,
    question: "Upload photos of your experience (optional but highly recommended)",
    placeholder: "Upload at least 1 photo. The first photo will be your cover photo.",
    tip: "Photos help travelers visualize your experience. Upload 3-10 photos for best results.",
    required: false,
    type: "photo",
    extractsTo: ["photos"],
    minPhotos: 0,
    maxPhotos: 10
  }
];

// Helper function to get question by ID
export function getQuestionById(id: string): QAQuestion | undefined {
  return GUIDED_QA_QUESTIONS.find(q => q.id === id);
}

// Helper function to get total question count
export function getTotalQuestionCount(): number {
  return GUIDED_QA_QUESTIONS.length;
}

// Helper function to get required question count
export function getRequiredQuestionCount(): number {
  return GUIDED_QA_QUESTIONS.filter(q => q.required).length;
}

