'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import Icon from '../ui/icon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: AISuggestion[];
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
    setInput('');
    setIsThinking(true);

    // TODO: Replace with actual API call to backend chat endpoint
    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock AI response based on input
    let assistantContent = '';
    let suggestion: AISuggestion | null = null;

    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('title') || lowerInput.includes('improve title')) {
      assistantContent = "I've analyzed your title. Here's a more engaging suggestion that better captures the essence of your experience.";
      suggestion = {
        id: `suggestion-${Date.now()}`,
        field: 'title',
        currentValue: formState.title,
        suggestedValue: formState.title ? `${formState.title}: A Journey Through Local Stories` : 'Sunset Heritage Walk Through Gandhi Bazaar',
        reasoning: 'Made it more specific and evocative to capture traveler interest',
        confidence: 85,
      };
    } else if (lowerInput.includes('price') || lowerInput.includes('cost')) {
      assistantContent = 'Based on similar experiences in your area, I recommend pricing between ₹1,500-₹2,500 per person. Consider your duration, group size, and unique value when setting the final price.';
      suggestion = {
        id: `suggestion-${Date.now()}`,
        field: 'price',
        currentValue: formState.price,
        suggestedValue: '2000',
        reasoning: 'Recommended price based on market analysis and experience value',
        confidence: 75,
      };
    } else if (lowerInput.includes('description') || lowerInput.includes('describe')) {
      assistantContent = 'Your description is good! Consider adding more sensory details about what travelers will see, hear, and feel. This helps create a vivid picture of the experience.';
    } else {
      assistantContent = "I'm here to help you refine your experience. You can ask me to improve specific fields like title, description, pricing, or get advice on any aspect of your experience.";
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      suggestions: suggestion ? [suggestion] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsThinking(false);
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    updateFormState({ [suggestion.field]: suggestion.suggestedValue });
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        suggestions: msg.suggestions?.filter((s) => s.id !== suggestion.id),
      }))
    );
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

function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: AISuggestion;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-900">Suggested Change</span>
            <span className="px-2 py-0.5 bg-terracotta-100 text-terracotta-700 text-xs rounded">
              {suggestion.confidence}% confident
            </span>
          </div>
          <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
        </div>
      </div>

      {/* Diff View */}
      <div className="space-y-2 text-xs">
        <div className="p-2 bg-red-50 rounded border border-red-200">
          <p className="text-red-700 line-through">
            {suggestion.currentValue || '(empty)'}
          </p>
        </div>
        <div className="p-2 bg-green-50 rounded border border-green-200">
          <p className="text-green-700">{suggestion.suggestedValue}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 px-3 py-1.5 bg-terracotta-500 text-white text-xs rounded-lg hover:bg-terracotta-600 transition-colors flex items-center justify-center gap-1"
        >
          <Icon as={Check} size={12} className="text-white" />
          Apply
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <Icon as={X} size={12} className="text-gray-700" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

