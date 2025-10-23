'use client';

import React, { useState, useEffect } from 'react';
import { EventRunAPI, EventRunCreate } from '@/lib/event-run-api';
import { experienceAPI, ExperienceResponse } from '@/lib/experience-api';

interface EventRunSchedulerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingEventRunId?: string | null; // For editing existing event runs
}

const EventRunScheduler: React.FC<EventRunSchedulerProps> = ({
  onSuccess,
  onCancel,
  editingEventRunId = null
}) => {
  // Form state
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<number>(4);
  const [specialPricing, setSpecialPricing] = useState<string>('');
  const [meetingInstructions, setMeetingInstructions] = useState<string>('');
  const [groupPairingEnabled, setGroupPairingEnabled] = useState<boolean>(false);

  // Loading and error states
  const [experiences, setExperiences] = useState<ExperienceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch approved experiences on mount
  useEffect(() => {
    fetchExperiences();
  }, []);

  // No need for complex date change logic since we start from tomorrow

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const allExperiences = await experienceAPI.getHostExperiences(50, 0);
      // Only show approved experiences
      const approvedExperiences = allExperiences.filter(exp => exp.status === 'approved');
      setExperiences(approvedExperiences);
    } catch (err: unknown) {
      console.error('Error fetching experiences:', err);
      setError('Failed to load your experiences. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Generate date options (next 90 days, starting from tomorrow)
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from tomorrow (i = 1) instead of today (i = 0)
    for (let i = 1; i < 91; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const displayString = date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      options.push({ value: dateString, label: displayString });
    }
    
    return options;
  };

  // Generate time options (9 AM to 9 PM in 30-minute intervals)
  const getTimeOptions = () => {
    const options = [];
    
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  // Auto-calculate end time when start time or experience changes
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    
    if (newStartTime && selectedExperienceData) {
      // Calculate end time based on start time + experience duration
      const [hours, minutes] = newStartTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Add experience duration in minutes
      const endDate = new Date(startDate.getTime() + (selectedExperienceData.duration_minutes * 60 * 1000));
      
      // Format end time as HH:MM
      const endTimeString = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      setEndTime(endTimeString);
    }
  };

  // Update end time when experience selection changes (if start time is already set)
  const handleExperienceChange = (newExperienceId: string) => {
    setSelectedExperience(newExperienceId);
    
    // If start time is already selected, recalculate end time with new experience duration
    if (startTime && newExperienceId) {
      const newExperienceData = experiences.find(exp => exp.id === newExperienceId);
      if (newExperienceData) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        
        // Add new experience duration
        const endDate = new Date(startDate.getTime() + (newExperienceData.duration_minutes * 60 * 1000));
        
        const endTimeString = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        setEndTime(endTimeString);
      }
    }
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!selectedExperience) return 'Please select an experience';
    if (!selectedDate) return 'Please select a date';
    if (!startTime) return 'Please select a start time';
    if (!endTime) return 'End time not calculated - please check your selections';
    if (maxCapacity < 1 || maxCapacity > 4) return 'Capacity must be between 1 and 4';

    // No need to check if event is in the future since we only allow dates from tomorrow onwards

    // Validate that the calculated end time doesn't go past 9 PM (21:00)
    const endDateTime = new Date(`${selectedDate}T${endTime}`);
    if (endDateTime.getHours() >= 22) {
      return 'Event cannot end after 10 PM. Please choose an earlier start time or a shorter experience.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Construct date-time strings
      const startDateTime = `${selectedDate}T${startTime}:00`;
      const endDateTime = `${selectedDate}T${endTime}:00`;

      const eventRunData: EventRunCreate = {
        experience_id: selectedExperience,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        max_capacity: maxCapacity,
        special_pricing_inr: specialPricing ? parseFloat(specialPricing) : null,
        host_meeting_instructions: meetingInstructions.trim() || null,
        group_pairing_enabled: groupPairingEnabled
      };

      await EventRunAPI.createEventRun(eventRunData);
      
      // Success - call parent success handler
      onSuccess?.();
      
    } catch (err: unknown) {
      console.error('Error creating event run:', err);
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to schedule event run. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedExperienceData = experiences.find(exp => exp.id === selectedExperience);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">Schedule Event Run</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Experience Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Select Experience *
          </label>
          {loading ? (
            <div className="border border-gray-300 rounded-md px-3 py-2 text-black">
              Loading your experiences...
            </div>
          ) : experiences.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              You don't have any approved experiences yet. 
              <a href="#" className="underline ml-1">Create an experience first</a>.
            </div>
          ) : (
            <>
              <select
                value={selectedExperience}
                onChange={(e) => handleExperienceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Choose an experience...</option>
                {experiences.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title} - {exp.experience_domain}
                  </option>
                ))}
              </select>
              
              {selectedExperienceData && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-black">
                  <p><span className="font-medium">Base Price:</span> ₹{selectedExperienceData.price_inr}/person</p>
                  <p><span className="font-medium">Duration:</span> {selectedExperienceData.duration_minutes} minutes</p>
                  <p><span className="font-medium">Location:</span> {selectedExperienceData.neighborhood}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Date *
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value="">Select a date...</option>
            {getDateOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Start Time *
            </label>
            <select
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Select time...</option>
              {getTimeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              End Time (Auto-calculated)
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-black">
              {endTime ? (
                new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              ) : (
                'Select start time first'
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Automatically calculated based on start time + experience duration
            </p>
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Maximum Capacity *
          </label>
          <select
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          >
            <option value={1}>1 person</option>
            <option value={2}>2 people</option>
            <option value={3}>3 people</option>
            <option value={4}>4 people</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Maximum number of travelers for this event run
          </p>
        </div>

        {/* Special Pricing */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Special Pricing (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={specialPricing}
              onChange={(e) => setSpecialPricing(e.target.value)}
              placeholder={selectedExperienceData ? selectedExperienceData.price_inr.toString() : "0"}
              min="0"
              step="50"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Leave empty to use the experience's base price
          </p>
        </div>

        {/* Meeting Instructions */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Meeting Instructions (Optional)
          </label>
          <textarea
            value={meetingInstructions}
            onChange={(e) => setMeetingInstructions(e.target.value)}
            placeholder="e.g., Look for me wearing a red Mayhouse cap near the main entrance"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Special instructions to help travelers find you ({meetingInstructions.length}/500)
          </p>
        </div>

        {/* Group Pairing */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="groupPairing"
            checked={groupPairingEnabled}
            onChange={(e) => setGroupPairingEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="groupPairing" className="text-sm text-black">
            <span className="font-medium">Enable group pairing</span>
            <p className="text-black mt-1">
              Allow solo travelers to be paired with others for this event run
            </p>
          </label>
        </div>

        {/* Submit buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={submitting || experiences.length === 0}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Scheduling...' : 'Schedule Event Run'}
          </button>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 text-xl">💡</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Scheduling Tips</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Events can only be scheduled from tomorrow onwards</li>
              <li>Once scheduled, event runs appear on the explore page for travelers to book</li>
              <li>End time is automatically calculated based on experience duration</li>
              <li>You can have maximum 2 active event runs at any time</li>
              <li>Events cannot end after 10 PM - choose start time accordingly</li>
              <li>Consider Mumbai's traffic when scheduling start times</li>
              <li>Weekend slots (Fri-Sun) tend to book faster</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRunScheduler;