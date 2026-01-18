'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Icon from '../ui/icon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DesignExperienceAPI } from '@/lib/design-experience-api';

export interface AppliedChange {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: AISuggestion[];
  appliedChange?: AppliedChange;
}

export interface AISuggestion {
  id: string;
  field: string;
  currentValue: any;
  suggestedValue: any;
  reasoning: string;
  confidence: number;
}

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
  requirements: string;
  whatToExpect: string;
  whatToKnow: string;
  whatToBring: string;
};

interface AIChatSidebarProps {
  sessionId: string | null;
  formState: FormState;
  updateFormState: (updates: Partial<FormState>) => void;
  currentStep: number;
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  singleInputNoResponse?: boolean;
}

export function AIChatSidebar({
  sessionId,
  formState,
  updateFormState,
  isOpen,
  onToggle,
  messages,
  setMessages,
  currentStep,
  singleInputNoResponse = false,
}: AIChatSidebarProps) {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(0);

  const createId = (prefix: string) => {
    nextIdRef.current += 1;
    return `${prefix}-${nextIdRef.current}`;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Build rich form context for LLM
  const buildRichFormContext = () => {
    const fields: Record<string, any> = {
      title: formState.title,
      description: formState.description,
      whatToExpect: formState.whatToExpect,
      domain: formState.domain,
      theme: formState.theme,
      duration_minutes: formState.duration,
      max_capacity: formState.maxCapacity,
      price_inr: formState.price ? parseFloat(formState.price) : null,
      neighborhood: formState.neighborhood,
      meeting_point: formState.meetingPoint,
      requirements: formState.requirements,
      what_to_bring: formState.whatToBring,
      what_to_know: formState.whatToKnow,
    };

    const filledFields = Object.values(fields).filter(v => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    }).length;

    const totalFields = Object.keys(fields).length;
    const completionPercentage = (filledFields / totalFields) * 100;

    const requiredFields = ['title', 'description', 'price_inr'];
    const missingRequired = requiredFields.filter(field => {
      const value = fields[field];
      return !value || (typeof value === 'string' && value.trim().length === 0);
    });

    const patterns = {
      hasLocation: !!(formState.neighborhood || formState.meetingPoint),
      hasPricing: !!formState.price,
      isFoodExperience: formState.domain === 'food',
      isCultureExperience: formState.domain === 'culture',
    };

    return {
      fields,
      completion: {
        percentage: completionPercentage,
        completed_count: filledFields,
        total_count: totalFields,
        missing_required: missingRequired,
      },
      patterns,
      currentStep,
      validationIssues: [],
    };
  };

  // Generate dynamic welcome message based on form state
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      const context = buildRichFormContext();
      const completion = context.completion.percentage;
      const missing = context.completion.missing_required;

      let welcomeContent = "Hi! I'm here to help you refine your experience. Ask me anything or request changes to specific fields.";

      if (completion === 0) {
        welcomeContent = "Hi! I'm here to help you create an amazing experience. Let's start with a title - what kind of experience are you creating?";
      } else if (completion < 30) {
        welcomeContent = `Great start! You've filled ${Math.round(completion)}% of your experience. I can help you with: ${missing.length > 0 ? missing.join(', ') : 'refining your content'}. What would you like to work on next?`;
      } else if (completion < 70) {
        welcomeContent = `You're making good progress (${Math.round(completion)}% complete)! I can help refine your content or fill the remaining fields. What would you like to improve?`;
      } else {
        welcomeContent = `You're almost done (${Math.round(completion)}% complete)! Let me help you polish the final details. What would you like to refine?`;
      }

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.title, formState.description, formState.price]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');

    // If single input mode, just mark as submitted and show check
    if (singleInputNoResponse) {
      setHasSubmitted(true);
      return;
    }

    setIsThinking(true);

    try {
      // Build rich form context
      const richContext = buildRichFormContext();

      // Build conversation history (last 15 messages)
      const conversationHistory = messages
        .slice(-15)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call backend chat API if we have a session
      if (sessionId) {
        const response = await DesignExperienceAPI.sendChatMessage(sessionId, {
          message: userInput,
          conversation_history: conversationHistory,
          form_context: richContext,
        });

        // Convert response to ChatMessage format
        const suggestions: AISuggestion[] = (response.suggestions || []).map((s: any) => ({
          id: createId('suggestion'),
          field: mapBackendFieldToFrontend(s.field),
          currentValue: s.current_value,
          suggestedValue: mapBackendValueToFrontend(s.field, s.suggested_value),
          reasoning: s.reasoning,
          confidence: s.confidence * 100, // Convert 0-1 to 0-100
        }));

        const assistantMessage: ChatMessage = {
          id: createId('assistant'),
          role: 'assistant',
          content: response.response,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Fallback: Use pattern matching if no session
        const fallbackResponse = generateFallbackResponse(userInput, formState);

        const assistantMessage: ChatMessage = {
          id: createId('assistant'),
          role: 'assistant',
          content: fallbackResponse.content,
          suggestions: fallbackResponse.suggestion ? [fallbackResponse.suggestion] : undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat API error:', error);

      // Fallback to pattern matching on error
      const fallbackResponse = generateFallbackResponse(userInput, formState);

      const assistantMessage: ChatMessage = {
        id: createId('assistant'),
        role: 'assistant',
        content: fallbackResponse.content || "I'm temporarily having trouble processing that. Could you try rephrasing?",
        suggestions: fallbackResponse.suggestion ? [fallbackResponse.suggestion] : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // Map backend field names to frontend form state fields
  const mapBackendFieldToFrontend = (backendField: string): string => {
    const mapping: Record<string, keyof FormState> = {
      'what_to_expect': 'whatToExpect',
      'price_inr': 'price',
      'duration_minutes': 'duration',
      'max_capacity': 'maxCapacity',
      'meeting_point': 'meetingPoint',
      'what_to_bring': 'whatToBring',
      'what_to_know': 'whatToKnow',
    };
    return mapping[backendField] || backendField;
  };

  // Map backend values to frontend format
  const mapBackendValueToFrontend = (backendField: string, value: any): any => {
    if (backendField === 'price_inr') {
      return typeof value === 'number' ? value.toString() : value;
    }
    return value;
  };

  // Fallback pattern matching (kept as backup)
  const generateFallbackResponse = (userInput: string, formState: FormState): { content: string; suggestion: AISuggestion | null } => {
    const lowerInput = userInput.toLowerCase();
    let assistantContent = '';
    let suggestion: AISuggestion | null = null;

    // Check if user wants to see current value
    if (lowerInput.includes('what is my') || lowerInput.includes('what\'s my') ||
      lowerInput.includes('show me my') || lowerInput.includes('tell me what my') ||
      (lowerInput.includes('description') && (lowerInput.includes('what') || lowerInput.includes('tell')))) {
      if (lowerInput.includes('description')) {
        assistantContent = formState.description
          ? `Here's your current description:\n\n"${formState.description}"\n\nWould you like me to improve it or make changes?`
          : "You haven't written a description yet. Would you like me to help you create one?";
      } else if (lowerInput.includes('title')) {
        assistantContent = formState.title
          ? `Your current title is: "${formState.title}"\n\nWould you like me to suggest improvements?`
          : "You haven't set a title yet. Would you like me to help you create one?";
      } else {
        assistantContent = "I can show you the current values for title, description, price, duration, or any other field. Which one would you like to see?";
      }
    }
    // Check if user wants to change/update a field
    else if (lowerInput.includes('change') || lowerInput.includes('update') ||
      lowerInput.includes('modify') || lowerInput.includes('edit') ||
      lowerInput.includes('make it') || lowerInput.includes('improve')) {

      if (lowerInput.includes('description')) {
        // Generate an improved description
        const currentDesc = formState.description || '';
        let newDescription = '';

        if (currentDesc) {
          // Enhance existing description
          newDescription = `${currentDesc}\n\nJoin us for an immersive experience where you'll discover hidden gems, interact with local artisans, and create lasting memories. This carefully curated journey offers authentic insights into the local culture, allowing you to see the destination through the eyes of someone who calls it home.`;
        } else {
          // Generate new description based on title/theme
          const context = formState.title || formState.theme || 'this experience';
          newDescription = `Embark on an unforgettable journey through ${context}. This immersive experience offers authentic insights into local culture, hidden gems, and unique perspectives that only a local can provide. You'll discover stories, traditions, and places that aren't in guidebooks, creating memories that will last a lifetime.`;
        }

        assistantContent = "I've created an enhanced description for you. Here's my suggestion:";
        suggestion = {
          id: createId('suggestion'),
          field: 'description',
          currentValue: currentDesc || '(empty)',
          suggestedValue: newDescription,
          reasoning: 'Enhanced with more engaging language, sensory details, and traveler benefits',
          confidence: 80,
        };
      }
      else if (lowerInput.includes('title')) {
        const currentTitle = formState.title || '';
        let newTitle = '';

        if (currentTitle) {
          // Improve existing title
          newTitle = currentTitle.includes(':') ? currentTitle : `${currentTitle}: An Authentic Local Experience`;
        } else {
          // Generate new title based on description/theme
          const context = formState.theme || formState.domain || 'Local Experience';
          newTitle = `Discover ${context}: A Journey Through Local Stories`;
        }

        assistantContent = "I've crafted a more engaging title for you:";
        suggestion = {
          id: createId('suggestion'),
          field: 'title',
          currentValue: currentTitle || '(empty)',
          suggestedValue: newTitle,
          reasoning: 'Made it more specific and evocative to capture traveler interest',
          confidence: 85,
        };
      }
      else if (lowerInput.includes('price') || lowerInput.includes('cost')) {
        assistantContent = 'Based on similar experiences in your area, I recommend pricing between ₹1,500-₹2,500 per person. Consider your duration, group size, and unique value when setting the final price.';
        suggestion = {
          id: createId('suggestion'),
          field: 'price',
          currentValue: formState.price || '(not set)',
          suggestedValue: '2000',
          reasoning: 'Recommended price based on market analysis and experience value',
          confidence: 75,
        };
      }
      else {
        assistantContent = "I can help you change title, description, price, duration, or other fields. Which field would you like to modify?";
      }
    }
    // Check for specific field improvements
    else if (lowerInput.includes('title') && (lowerInput.includes('improve') || lowerInput.includes('better'))) {
      const newTitle = formState.title
        ? `${formState.title}: A Journey Through Local Stories`
        : 'Sunset Heritage Walk Through Gandhi Bazaar';
      assistantContent = "I've analyzed your title. Here's a more engaging suggestion:";
      suggestion = {
        id: createId('suggestion'),
        field: 'title',
        currentValue: formState.title || '(empty)',
        suggestedValue: newTitle,
        reasoning: 'Made it more specific and evocative to capture traveler interest',
        confidence: 85,
      };
    }
    else if (lowerInput.includes('description') && (lowerInput.includes('improve') || lowerInput.includes('better'))) {
      const currentDesc = formState.description || '';
      const newDescription = currentDesc
        ? `${currentDesc}\n\nThis carefully curated experience offers authentic insights and hidden gems that only locals know about.`
        : 'Join us for an immersive journey through local culture, where you\'ll discover unique stories, traditions, and places that create lasting memories.';
      assistantContent = "I've enhanced your description with more engaging details:";
      suggestion = {
        id: createId('suggestion'),
        field: 'description',
        currentValue: currentDesc || '(empty)',
        suggestedValue: newDescription,
        reasoning: 'Added sensory details and traveler benefits to make it more compelling',
        confidence: 80,
      };
    }
    // Default helpful response
    else {
      assistantContent = "I'm here to help you refine your experience. You can:\n\n• Ask me to show your current description, title, or other fields\n• Request changes like 'change the description' or 'improve the title'\n• Get advice on pricing, duration, or other aspects\n\nWhat would you like to do?";
    }

    return { content: assistantContent, suggestion };
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: 'Experience Title',
      description: 'Description',
      price: 'Price',
      duration: 'Duration',
      maxCapacity: 'Max Capacity',
      neighborhood: 'Neighborhood',
      meetingPoint: 'Meeting Point',
      theme: 'Theme',
      domain: 'Category',
      whatToExpect: 'What to Expect',
      whatToKnow: 'What to Know',
      whatToBring: 'What to Bring',
      requirements: 'Requirements',
    };
    return labels[field] || field;
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    const oldValue = formState[suggestion.field as keyof typeof formState] || '';

    // Update the form state
    updateFormState({ [suggestion.field]: suggestion.suggestedValue });

    // Remove the suggestion from messages
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        suggestions: msg.suggestions?.filter((s) => s.id !== suggestion.id),
      }))
    );

    // Add a confirmation message with the applied change
    const appliedChange: AppliedChange = {
      id: createId('applied'),
      field: suggestion.field,
      oldValue: oldValue,
      newValue: suggestion.suggestedValue,
      timestamp: new Date(),
    };

    const confirmationMessage: ChatMessage = {
      id: createId('confirmation'),
      role: 'assistant',
      content: `✅ Applied changes to ${getFieldLabel(suggestion.field)}`,
      timestamp: new Date(),
      appliedChange: appliedChange,
    };

    setMessages((prev) => [...prev, confirmationMessage]);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        suggestions: msg.suggestions?.filter((s) => s.id !== suggestionId),
      }))
    );
  };

  const handleQuickSuggestion = (text: string) => {
    setInput(text);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-terracotta-500 text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-terracotta-600 transition-all z-50"
      >
        <div className="flex flex-col items-center gap-2">
          <Icon as={Sparkles} size={20} className="text-white" />
          <span className="text-xs writing-mode-vertical-rl">AI Assistant</span>
        </div>
      </button>
    );
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)] bg-gradient-to-br from-orange-50/50 to-rose-50/50 dark:from-orange-950/20 dark:to-rose-950/20 border">
      {/* Header - Match AIAssistant style */}
      <div className="p-4 border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center">
            <Icon as={Sparkles} size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium">AI Assistant</h3>
            <Badge variant="secondary" className="text-xs">
              PRIMARY
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Chat to refine your experience
        </p>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 space-y-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center flex-shrink-0">
                    <Icon as={Sparkles} size={16} className="text-terracotta-600" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${message.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white'
                      : 'bg-white dark:bg-gray-800 border'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>

              {/* Applied Change Diff View */}
              {message.appliedChange && (
                <div className="ml-11 mt-3">
                  <AppliedChangeCard change={message.appliedChange} />
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="ml-11 mt-3 space-y-2">
                  {message.suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={() => applySuggestion(suggestion)}
                      onDismiss={() => dismissSuggestion(suggestion.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center">
                <Icon as={Sparkles} size={16} className="text-terracotta-600 animate-pulse" />
              </div>
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Show check when submitted in single-input mode */}
          {singleInputNoResponse && hasSubmitted && (
            <div className="flex justify-center">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Message received</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur">
        <div className="mb-2 px-2 py-1.5 bg-terracotta-100/50 rounded-lg">
          <p className="text-[11px] text-terracotta-900 font-medium">
            <Icon as={Sparkles} size={12} className="inline mr-1" />
            Primary editing interface - Chat naturally to make changes
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={hasSubmitted && singleInputNoResponse ? "Message sent" : "Type what you want to change..."}
            disabled={isThinking || (singleInputNoResponse && hasSubmitted)}
            className="flex-1 border-2 border-terracotta-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking || (singleInputNoResponse && hasSubmitted)}
            className="p-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {!hasSubmitted && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickSuggestion('Improve my title')}
              disabled={isThinking}
              className="px-3 py-1.5 text-xs border border-terracotta-200 bg-white rounded-lg hover:bg-terracotta-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium"
            >
              Improve title
            </button>
            <button
              onClick={() => handleQuickSuggestion('Change the description')}
              disabled={isThinking}
              className="px-3 py-1.5 text-xs border border-terracotta-200 bg-white rounded-lg hover:bg-terracotta-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium"
            >
              Improve description
            </button>
            <button
              onClick={() => handleQuickSuggestion('Price advice')}
              disabled={isThinking}
              className="px-3 py-1.5 text-xs border border-terracotta-200 bg-white rounded-lg hover:bg-terracotta-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium"
            >
              Price advice
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function AppliedChangeCard({ change }: { change: AppliedChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: 'Experience Title',
      description: 'Description',
      price: 'Price',
      duration: 'Duration',
      maxCapacity: 'Max Capacity',
      neighborhood: 'Neighborhood',
      meetingPoint: 'Meeting Point',
      theme: 'Theme',
      domain: 'Category',
      whatToExpect: 'What to Expect',
      whatToKnow: 'What to Know',
      whatToBring: 'What to Bring',
      requirements: 'Requirements',
    };
    return labels[field] || field;
  };

  const isLongText = (value: any) => {
    return typeof value === 'string' && value.length > 100;
  };

  const oldValue = change.oldValue || '(empty)';
  const newValue = change.newValue;
  const isLong = isLongText(oldValue) || isLongText(newValue);

  // Truncate for preview
  const truncateText = (text: string, maxLength: number = 80) => {
    if (typeof text !== 'string') return String(text);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const previewOld = typeof oldValue === 'string' ? truncateText(oldValue, 60) : oldValue;
  const previewNew = typeof newValue === 'string' ? truncateText(newValue, 60) : newValue;

  return (
    <div className="border border-green-200 rounded-lg bg-green-50/30 overflow-hidden shadow-sm">
      {/* Collapsible Header - Cursor Style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-green-100/50 hover:bg-green-100/70 transition-colors flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
          <span className="text-xs font-semibold text-green-800 truncate">
            {getFieldLabel(change.field)}
          </span>
          <span className="px-1.5 py-0.5 bg-green-200 text-green-800 text-xs rounded font-medium flex-shrink-0">
            ✓
          </span>
        </div>
        <Icon
          as={isExpanded ? ChevronUp : ChevronDown}
          size={14}
          className="text-green-700 flex-shrink-0"
        />
      </button>

      {/* Preview (when collapsed) */}
      {!isExpanded && (
        <div className="px-3 py-2 text-xs text-gray-600 border-t border-green-200">
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-medium">-</span>
            <span className="line-through text-gray-500 flex-1 truncate">{previewOld}</span>
          </div>
          <div className="flex items-start gap-2 mt-1">
            <span className="text-green-600 font-medium">+</span>
            <span className="text-gray-700 flex-1 truncate">{previewNew}</span>
          </div>
        </div>
      )}

      {/* Expanded Diff View - Cursor Style */}
      {isExpanded && (
        <div className="relative border-t border-green-200">
          {isLong ? (
            // Stacked view for long text (like description)
            <div className="divide-y divide-green-200">
              {/* Old Value */}
              <div className="bg-red-50/40 border-l-4 border-red-400">
                <div className="px-4 py-2 bg-red-50/60 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                      Before
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {oldValue}
                  </p>
                </div>
              </div>

              {/* New Value */}
              <div className="bg-green-50/40 border-l-4 border-green-500">
                <div className="px-4 py-2 bg-green-50/60 border-b border-green-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      After
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {newValue}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Side-by-side view for short text (like title, price)
            <div className="grid grid-cols-2 divide-x divide-green-200">
              {/* Old Value */}
              <div className="bg-red-50/40 border-l-4 border-red-400">
                <div className="px-3 py-2 bg-red-50/60 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-xs font-semibold text-red-700">Before</span>
                  </div>
                </div>
                <div className="px-3 py-3">
                  <p className="text-xs text-gray-800 break-words">
                    {oldValue}
                  </p>
                </div>
              </div>

              {/* New Value */}
              <div className="bg-green-50/40 border-l-4 border-green-500">
                <div className="px-3 py-2 bg-green-50/60 border-b border-green-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-xs font-semibold text-green-700">After</span>
                  </div>
                </div>
                <div className="px-3 py-3">
                  <p className="text-xs text-gray-800 break-words">
                    {newValue}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: AISuggestion;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: 'Experience Title',
      description: 'Description',
      price: 'Price',
      duration: 'Duration',
      maxCapacity: 'Max Capacity',
      neighborhood: 'Neighborhood',
      meetingPoint: 'Meeting Point',
      theme: 'Theme',
      domain: 'Category',
      whatToExpect: 'What to Expect',
      whatToKnow: 'What to Know',
      whatToBring: 'What to Bring',
      requirements: 'Requirements',
    };
    return labels[field] || field;
  };

  const isLongText = (value: any) => {
    return typeof value === 'string' && value.length > 100;
  };

  const currentValue = suggestion.currentValue || '(empty)';
  const suggestedValue = suggestion.suggestedValue;

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-terracotta-500"></div>
            <span className="text-xs font-semibold text-gray-900">
              {getFieldLabel(suggestion.field)}
            </span>
            <span className="px-2 py-0.5 bg-terracotta-100 text-terracotta-700 text-xs rounded font-medium">
              {suggestion.confidence}% confident
            </span>
          </div>
        </div>
        {suggestion.reasoning && (
          <p className="text-xs text-gray-600 mt-1.5">{suggestion.reasoning}</p>
        )}
      </div>

      {/* Diff View - Cursor Style */}
      <div className="relative">
        {/* Side-by-side view for short text, stacked for long text */}
        {isLongText(currentValue) || isLongText(suggestedValue) ? (
          // Stacked view for long text (like description)
          <div className="divide-y divide-gray-200">
            {/* Current Value */}
            <div className="bg-red-50/30 border-l-4 border-red-400">
              <div className="px-4 py-2 bg-red-50/50 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Current
                  </span>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {currentValue}
                </p>
              </div>
            </div>

            {/* Suggested Value */}
            <div className="bg-green-50/30 border-l-4 border-green-400">
              <div className="px-4 py-2 bg-green-50/50 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Suggested
                  </span>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {suggestedValue}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Side-by-side view for short text (like title, price)
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            {/* Current Value */}
            <div className="bg-red-50/30 border-l-4 border-red-400">
              <div className="px-3 py-2 bg-red-50/50 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-xs font-semibold text-red-700">Current</span>
                </div>
              </div>
              <div className="px-3 py-3">
                <p className="text-xs text-gray-800 break-words">
                  {currentValue}
                </p>
              </div>
            </div>

            {/* Suggested Value */}
            <div className="bg-green-50/30 border-l-4 border-green-400">
              <div className="px-3 py-2 bg-green-50/50 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="text-xs font-semibold text-green-700">Suggested</span>
                </div>
              </div>
              <div className="px-3 py-3">
                <p className="text-xs text-gray-800 break-words">
                  {suggestedValue}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 px-3 py-2 bg-terracotta-500 text-white text-xs font-medium rounded-lg hover:bg-terracotta-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Icon as={Check} size={14} className="text-white" />
          Apply Changes
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Icon as={X} size={14} className="text-gray-700" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

