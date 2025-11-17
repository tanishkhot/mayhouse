'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ChevronRight, ChevronLeft, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Icon from '../ui/icon';

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

interface AIChatSidebarProps {
  formState: {
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
  updateFormState: (updates: Partial<typeof formState>) => void;
  currentStep: number;
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function AIChatSidebar({
  formState,
  updateFormState,
  currentStep,
  isOpen,
  onToggle,
  messages,
  setMessages,
}: AIChatSidebarProps) {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsThinking(true);

    // TODO: Replace with actual API call to backend chat endpoint
    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Parse user intent and generate appropriate response
    const lowerInput = userInput.toLowerCase();
    let assistantContent = '';
    let suggestion: AISuggestion | null = null;
    let shouldAutoApply = false;

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
          id: `suggestion-${Date.now()}`,
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
          id: `suggestion-${Date.now()}`,
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
          id: `suggestion-${Date.now()}`,
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
        id: `suggestion-${Date.now()}`,
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
        id: `suggestion-${Date.now()}`,
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

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      suggestions: suggestion ? [suggestion] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    
    // Auto-apply if user explicitly requested a change and we have a suggestion
    if (shouldAutoApply && suggestion) {
      setTimeout(() => {
        applySuggestion(suggestion!);
      }, 500);
    }
    
    setIsThinking(false);
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
      id: `applied-${Date.now()}`,
      field: suggestion.field,
      oldValue: oldValue,
      newValue: suggestion.suggestedValue,
      timestamp: new Date(),
    };
    
    const confirmationMessage: ChatMessage = {
      id: `confirmation-${Date.now()}`,
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
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col fixed right-0 top-16 bottom-0 z-40 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center">
            <Icon as={Sparkles} size={16} className="text-terracotta-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">AI Assistant</h4>
            <p className="text-xs text-gray-500">Always here to help</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close chat"
        >
          <Icon as={ChevronRight} size={16} className="text-gray-600" />
        </button>
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
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-terracotta-500 text-white'
                      : 'bg-gray-100 text-gray-900'
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
              <div className="bg-gray-100 rounded-lg p-3">
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
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask for help or request changes..."
            disabled={isThinking}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="p-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Icon as={Send} size={16} className="text-white" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickSuggestion('Improve my title')}
            disabled={isThinking}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
          >
            Improve title
          </button>
          <button
            onClick={() => handleQuickSuggestion('Change the description')}
            disabled={isThinking}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
          >
            Improve description
          </button>
          <button
            onClick={() => handleQuickSuggestion('Price advice')}
            disabled={isThinking}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
          >
            Price advice
          </button>
        </div>
      </div>
    </div>
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
  const isTextDiff = typeof currentValue === 'string' && typeof suggestedValue === 'string';

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

