'use client';

import React, { useState } from 'react';
import { experienceAPI, type ExperienceResponse } from '@/lib/experience-api';
import { mapFormToExperienceCreate, type FormState } from '@/lib/experience-mapper';
import { DesignExperienceAPI } from '@/lib/design-experience-api';
import { toast } from 'sonner';

/**
 * Test component to verify end-to-end data flow:
 * 1. Generate experience from Q&A
 * 2. Populate form
 * 3. Save to database
 * 4. Verify in database
 * 5. Display saved experience
 */
export default function ExperienceSaveTest() {
  const [testStep, setTestStep] = useState<'idle' | 'generating' | 'saving' | 'verifying' | 'complete'>('idle');
  const [savedExperience, setSavedExperience] = useState<ExperienceResponse | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string, success: boolean) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${message}`]);
  };

  const testQAFlow = async () => {
    setTestStep('generating');
    setTestResults([]);
    addTestResult('Starting Q&A flow test...', true);

    try {
      // Simulate Q&A answers (using sample data)
      const sampleQAAnswers = [
        {
          question_id: 'q1',
          question_text: "What's the main experience you want to share?",
          answer: 'A sunset heritage walk through old Bangalore markets where we discover century-old spice merchants, family-run sweet shops, and hidden temples. Travelers will learn about local traditions, taste authentic flavors, and hear stories passed down through generations.',
          answered_at: new Date().toISOString(),
          character_count: 245,
        },
        {
          question_id: 'q2',
          question_text: 'Where exactly does this experience take place?',
          answer: 'We meet at the Gateway of India main entrance. I will be wearing a red Mayhouse cap and carrying a professional camera bag. From there, we will walk through Colaba Causeway to explore hidden street food gems.',
          answered_at: new Date().toISOString(),
          character_count: 156,
        },
        {
          question_id: 'q7',
          question_text: 'Final details - How long is the experience?',
          answer: null,
          structured_data: {
            duration_minutes: 180,
            traveler_max_capacity: 4,
            price_inr: 2000,
          },
          answered_at: new Date().toISOString(),
        },
      ];

      // Generate experience from Q&A
      addTestResult('Generating experience from Q&A answers...', true);
      const generated = await DesignExperienceAPI.generateFromQA(sampleQAAnswers);
      addTestResult('Experience generated successfully', true);
      addTestResult(`Generated title: ${generated.title}`, true);
      addTestResult(`Generated domain: ${generated.domain}`, true);

      // Map to form state
      const formState: FormState = {
        title: generated.title,
        description: generated.description,
        domain: generated.domain,
        theme: generated.theme || '',
        duration: generated.duration_minutes,
        maxCapacity: generated.max_capacity,
        price: generated.price_inr ? generated.price_inr.toString() : '2000',
        neighborhood: generated.neighborhood || 'Colaba',
        meetingPoint: generated.meeting_point || 'Gateway of India',
        requirements: generated.requirements?.join(', ') || '',
        whatToExpect: generated.what_to_expect,
        whatToKnow: generated.what_to_know || '',
        whatToBring: generated.what_to_bring?.join(', ') || '',
      };

      addTestResult('Form state mapped successfully', true);

      // Test saving
      setTestStep('saving');
      addTestResult('Saving experience to database...', true);

      const experienceData = mapFormToExperienceCreate(formState);
      addTestResult('Experience data mapped to API format', true);

      const created = await experienceAPI.createExperience(experienceData);
      setSavedExperience(created);
      addTestResult(`Experience saved with ID: ${created.id}`, true);
      addTestResult(`Status: ${created.status}`, true);

      // Verify saved data
      setTestStep('verifying');
      addTestResult('Verifying saved experience...', true);

      const retrieved = await experienceAPI.getExperience(created.id);
      addTestResult('Experience retrieved from database', true);

      // Verify fields
      if (retrieved.title === generated.title) {
        addTestResult('Title matches', true);
      } else {
        addTestResult(`Title mismatch: expected "${generated.title}", got "${retrieved.title}"`, false);
      }

      if (retrieved.description === generated.description) {
        addTestResult('Description matches', true);
      } else {
        addTestResult('Description mismatch', false);
      }

      if (retrieved.experience_domain === generated.domain) {
        addTestResult('Domain matches', true);
      } else {
        addTestResult('Domain mismatch', false);
      }

      setTestStep('complete');
      addTestResult('All tests completed!', true);
      toast.success('Test completed successfully!');

    } catch (error: any) {
      console.error('Test error:', error);
      addTestResult(`Error: ${error.message || 'Unknown error'}`, false);
      toast.error('Test failed');
      setTestStep('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold text-black mb-6">Experience Save Test</h2>
      
      <div className="mb-6">
        <button
          onClick={testQAFlow}
          disabled={testStep !== 'idle'}
          className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testStep === 'idle' && 'Run Full Test Flow'}
          {testStep === 'generating' && 'Generating...'}
          {testStep === 'saving' && 'Saving...'}
          {testStep === 'verifying' && 'Verifying...'}
          {testStep === 'complete' && 'Test Complete'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-black mb-3">Test Results</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 max-h-96 overflow-y-auto">
            {testResults.map((result, idx) => (
              <div key={idx} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {savedExperience && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Saved Experience</h3>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {savedExperience.id}</p>
            <p><strong>Title:</strong> {savedExperience.title}</p>
            <p><strong>Status:</strong> {savedExperience.status}</p>
            <p><strong>Domain:</strong> {savedExperience.experience_domain}</p>
            <p><strong>Price:</strong> ₹{savedExperience.price_inr}</p>
            <p><strong>Duration:</strong> {savedExperience.duration_minutes} minutes</p>
            <p><strong>Created:</strong> {new Date(savedExperience.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

