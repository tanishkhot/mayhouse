import { useState, useRef, useEffect } from "react";
import { ExperienceFormState, ChatMessage, AISuggestion } from "./types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Sparkles, Send, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { Badge } from "../ui/badge";

interface Props {
  formState: ExperienceFormState;
  updateFormState: (updates: Partial<ExperienceFormState>) => void;
  currentStep: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function AIChatSidebar({ formState, updateFormState, currentStep, isOpen, onToggle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm here to help you refine your experience. Ask me anything or request changes to specific fields.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock suggestion based on input
    const suggestion: AISuggestion = {
      id: `suggestion-${Date.now()}`,
      field: "title",
      currentValue: formState.title,
      suggestedValue: "Sunset Heritage Walk Through Gandhi Bazaar's Hidden Stories",
      reasoning: "Made it more specific and evocative to capture traveler interest",
      confidence: 85,
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "I've made your title more engaging and specific. This should help attract travelers looking for authentic local experiences.",
      suggestions: [suggestion],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsThinking(false);
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    updateFormState({ [suggestion.field]: suggestion.suggestedValue });
    setMessages(prev => prev.map(msg => ({
      ...msg,
      suggestions: msg.suggestions?.filter(s => s.id !== suggestion.id)
    })));
  };

  const dismissSuggestion = (suggestionId: string) => {
    setMessages(prev => prev.map(msg => ({
      ...msg,
      suggestions: msg.suggestions?.filter(s => s.id !== suggestionId)
    })));
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-6 rounded-l-lg shadow-lg hover:px-4 transition-all"
      >
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="size-5" />
          <span className="text-xs writing-mode-vertical-rl rotate-180">AI Assistant</span>
        </div>
      </button>
    );
  }

  return (
    <div className="w-96 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm">AI Assistant</h4>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4" ref={scrollRef}>
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="size-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}>
                    <p className="text-sm">{message.content}</p>
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
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="size-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask for help or request changes..."
            disabled={isThinking}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Make my title more engaging")}
            disabled={isThinking}
          >
            Improve title
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Suggest a better price")}
            disabled={isThinking}
          >
            Price advice
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ 
  suggestion, 
  onApply, 
  onDismiss 
}: { 
  suggestion: AISuggestion; 
  onApply: () => void; 
  onDismiss: () => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">Suggested Change</span>
            <Badge variant="secondary" className="text-xs">
              {suggestion.confidence}% confident
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
        </div>
      </div>

      {/* Diff View */}
      <div className="space-y-2 text-xs">
        <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
          <p className="text-red-700 dark:text-red-400 line-through">{suggestion.currentValue || "(empty)"}</p>
        </div>
        <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
          <p className="text-green-700 dark:text-green-400">{suggestion.suggestedValue}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={onApply} className="flex-1">
          <Check className="size-3 mr-1" />
          Apply
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} className="flex-1">
          <X className="size-3 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}