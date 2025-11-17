'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, HelpCircle } from 'lucide-react';
import Icon from '../ui/icon';
import { GUIDED_QA_QUESTIONS, type QAQuestion } from '@/lib/guided-qa-questions';
import { toast } from 'sonner';
import { DesignExperienceAPI } from '@/lib/design-experience-api';

interface QAAnswer {
  question_id: string;
  question_text: string;
  answer: string | null;
  structured_data?: Record<string, any>;
  photo_ids?: string[];
  answered_at: string;
  character_count?: number;
}

interface GuidedQAFlowProps {
  sessionId?: string;
  onComplete: (generatedData: any) => void;
  onCancel: () => void;
}

export default function GuidedQAFlow({ sessionId, onComplete, onCancel }: GuidedQAFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QAAnswer>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [structuredData, setStructuredData] = useState<Record<string, number | null>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentQuestion = GUIDED_QA_QUESTIONS[currentQuestionIndex];
  const totalQuestions = GUIDED_QA_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Load existing answers if sessionId is provided
  useEffect(() => {
    // TODO: Load existing answers from session if resuming
  }, [sessionId]);

  // Initialize current answer when question changes
  useEffect(() => {
    const existingAnswer = answers.get(currentQuestion.id);
    if (currentQuestion.type === 'textarea') {
      setCurrentAnswer(existingAnswer?.answer || '');
    } else if (currentQuestion.type === 'number') {
      setStructuredData(existingAnswer?.structured_data || {});
    } else {
      setCurrentAnswer('');
      setStructuredData({});
    }
  }, [currentQuestion.id, currentQuestion.type, answers]);

  // Auto-save answers
  useEffect(() => {
    if (answers.size > 0 && sessionId) {
      const saveAnswers = async () => {
        setIsSaving(true);
        try {
          await DesignExperienceAPI.saveQAAnswers(sessionId, Array.from(answers.values()));
        } catch (error) {
          console.error('Failed to auto-save:', error);
          // Don't show error toast for auto-save failures
        } finally {
          setIsSaving(false);
        }
      };
      
      // Debounce auto-save
      const timeoutId = setTimeout(saveAnswers, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [answers, sessionId]);

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
    
    // Validate min/max length
    if (currentQuestion.minLength && value.length < currentQuestion.minLength) {
      return;
    }
    if (currentQuestion.maxLength && value.length > currentQuestion.maxLength) {
      return;
    }
  };

  const handleStructuredDataChange = (fieldName: string, value: number | null) => {
    setStructuredData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const saveCurrentAnswer = () => {
    if (!currentQuestion) return;

    const answer: QAAnswer = {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      answer: currentQuestion.type === 'textarea' ? currentAnswer : null,
      structured_data: currentQuestion.type === 'number' ? structuredData : undefined,
      answered_at: new Date().toISOString(),
      character_count: currentQuestion.type === 'textarea' ? currentAnswer.length : undefined,
    };

    setAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(currentQuestion.id, answer);
      return newMap;
    });
  };

  const handleNext = () => {
    // Validate required questions
    if (currentQuestion.required) {
      if (currentQuestion.type === 'textarea' && (!currentAnswer || currentAnswer.length < (currentQuestion.minLength || 0))) {
        toast.error(`Please provide an answer (minimum ${currentQuestion.minLength} characters)`);
        return;
      }
      if (currentQuestion.type === 'number') {
        const requiredFields = currentQuestion.fields?.filter(f => f.name === 'duration_minutes' || f.name === 'traveler_max_capacity' || f.name === 'price_inr');
        const missingFields = requiredFields?.filter(f => !structuredData[f.name] || structuredData[f.name] === null);
        if (missingFields && missingFields.length > 0) {
          toast.error('Please fill in all required fields');
          return;
        }
      }
    }

    saveCurrentAnswer();

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    saveCurrentAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleGenerate = async () => {
    // Save current answer first
    saveCurrentAnswer();

    // Validate all required questions
    const requiredQuestions = GUIDED_QA_QUESTIONS.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q => !answers.has(q.id));
    
    if (missingAnswers.length > 0) {
      toast.error(`Please answer all required questions (${missingAnswers.length} remaining)`);
      return;
    }

    setIsGenerating(true);
    try {
      const allAnswers = Array.from(answers.values());
      const generated = await DesignExperienceAPI.generateFromQA(allAnswers);
      onComplete(generated);
      toast.success('Experience generated! Review and edit the fields below.');
    } catch (error: any) {
      console.error('Error generating experience:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to generate experience. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    
    if (currentQuestion.type === 'textarea') {
      return currentAnswer.length >= (currentQuestion.minLength || 0);
    }
    
    if (currentQuestion.type === 'number') {
      const requiredFields = currentQuestion.fields?.filter(f => 
        f.name === 'duration_minutes' || f.name === 'traveler_max_capacity' || f.name === 'price_inr'
      );
      return requiredFields?.every(f => structuredData[f.name] && structuredData[f.name]! > 0) || false;
    }
    
    return true;
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allRequiredAnswered = GUIDED_QA_QUESTIONS
    .filter(q => q.required)
    .every(q => answers.has(q.id));

  // Keyboard shortcut: Cmd+Enter (Mac) or Ctrl+Enter (Windows) to go to next question
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows)
      const isModifierPressed = e.metaKey || e.ctrlKey;
      if (isModifierPressed && e.key === 'Enter') {
        // Only trigger if button is not disabled and not currently generating
        if (isLastQuestion) {
          // On last question, trigger generate if all required are answered
          if (allRequiredAnswered && !isGenerating) {
            e.preventDefault();
            handleGenerate();
          }
        } else {
          // On other questions, trigger next if can proceed
          if (canProceed() && !isGenerating) {
            e.preventDefault();
            handleNext();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastQuestion, allRequiredAnswered, isGenerating, currentAnswer, structuredData, currentQuestion, currentQuestionIndex, totalQuestions, answers]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border shadow-sm p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="text-sm text-black/70 mb-4 hover:underline inline-flex items-center gap-1"
        >
          <Icon as={ChevronLeft} size={16} className="text-black/70" />
          Back
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-black mb-2">Let's Build Together</h3>
            <p className="text-black/70">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          {isSaving && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-terracotta-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-black mb-3">
            {currentQuestion.question}
          </h4>
          
          {currentQuestion.tip && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon as={HelpCircle} size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">{currentQuestion.tip}</p>
              </div>
            </div>
          )}
        </div>

        {/* Answer Input */}
        {currentQuestion.type === 'textarea' && (
          <div>
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              onKeyDown={(e) => {
                // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows) to go to next
                const isModifierPressed = e.metaKey || e.ctrlKey;
                if (isModifierPressed && e.key === 'Enter') {
                  if (isLastQuestion) {
                    if (allRequiredAnswered && !isGenerating) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  } else {
                    if (canProceed() && !isGenerating) {
                      e.preventDefault();
                      handleNext();
                    }
                  }
                }
              }}
              placeholder={currentQuestion.placeholder}
              className="w-full min-h-[200px] border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              rows={6}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>
                {currentAnswer.length} characters
                {currentQuestion.minLength && (
                  <span className={currentAnswer.length < currentQuestion.minLength ? 'text-red-500' : ''}>
                    {' '}(min: {currentQuestion.minLength})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                {currentQuestion.example && (
                  <button
                    onClick={() => setCurrentAnswer(currentQuestion.example || '')}
                    className="text-terracotta-600 hover:underline"
                  >
                    Use example
                  </button>
                )}
                <span className="text-gray-400">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                    {typeof window !== 'undefined' && (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0) ? '⌘' : 'Ctrl'}
                  </kbd>
                  {' '}+{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd>
                  {' '}to continue
                </span>
              </div>
            </div>
          </div>
        )}

        {currentQuestion.type === 'number' && currentQuestion.fields && (
          <div className="space-y-4">
            {currentQuestion.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-black mb-2">
                  {field.label} {field.name === 'price_inr' && '*'}
                </label>
                <input
                  type="number"
                  value={structuredData[field.name] || field.default || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    handleStructuredDataChange(field.name, value);
                  }}
                  onKeyDown={(e) => {
                    // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows) to go to next
                    const isModifierPressed = e.metaKey || e.ctrlKey;
                    if (isModifierPressed && e.key === 'Enter') {
                      if (isLastQuestion) {
                        if (allRequiredAnswered && !isGenerating) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      } else {
                        if (canProceed() && !isGenerating) {
                          e.preventDefault();
                          handleNext();
                        }
                      }
                    }
                  }}
                  min={field.min}
                  max={field.max}
                  placeholder={field.default?.toString()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                />
                {field.min && field.max && (
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {field.min} - {field.max}
                  </p>
                )}
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-2">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                {typeof window !== 'undefined' && (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0) ? '⌘' : 'Ctrl'}
              </kbd>
              {' '}+{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd>
              {' '}to continue
            </div>
          </div>
        )}

        {currentQuestion.type === 'photo' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">Photo upload coming soon</p>
            <p className="text-sm text-gray-400">
              You can skip this and add photos later
            </p>
          </div>
        )}

        {/* Example (collapsible) */}
        {currentQuestion.example && currentQuestion.type === 'textarea' && (
          <details className="mt-4">
            <summary className="text-sm text-terracotta-600 cursor-pointer hover:underline">
              Show example answer
            </summary>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentQuestion.example}
              </p>
            </div>
          </details>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Icon as={ChevronLeft} size={16} className="text-gray-700" />
          Back
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleGenerate}
            disabled={!allRequiredAnswered || isGenerating}
            className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            Next
            <Icon as={ChevronRight} size={16} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

