'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import Icon from '../ui/icon';

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

const INITIAL: FormState = {
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

export default function DesignExperienceV2() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'kickstart' | 'describe' | 'guided'>('kickstart');
  const [form, setForm] = useState<FormState>(INITIAL);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; isCover: boolean; caption?: string }>>([]);

  useEffect(() => {
    try {
      console.log('[FLOW] DesignExperienceV2 mounted', { ts: new Date().toISOString() });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      console.log('[FLOW] DesignExperienceV2 step change', { step, ts: new Date().toISOString() });
    } catch {}
  }, [step]);

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

  const badge = (ok: boolean) =>
    ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';

  const fieldClasses = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-black focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:ring-terracotta-500 focus:border-terracotta-500'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">
              {step === 0 ? 'Kickstart Your Experience' : 'Design Your Experience'}
            </h1>
            <p className="text-black/70">
              {step === 0
                ? 'Choose how you want to begin. We’ll guide you the rest of the way.'
                : 'Create a unique local adventure for travelers'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs ${badge(completion.basicsOk)}`}>Basics</span>
            <span className={`px-3 py-1 rounded-full text-xs ${badge(completion.detailsOk)}`}>Logistics</span>
            <span className={`px-3 py-1 rounded-full text-xs ${badge(completion.mediaOk)}`}>Media</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step 0 - Kickstart choices */}
        {step === 0 && mode === 'kickstart' && (
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
                  Tell us in your own words. We’ll handle the structure.
                </div>
              </button>

              <button
                onClick={() => setMode('guided')}
                className="text-left bg-white rounded-xl border shadow-[0_4px_14px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.10),0_4px_10px_rgba(0,0,0,0.06)] transition p-6"
              >
                <div className="h-9 w-9 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center mb-3">
                  <Icon as={HelpCircle} size={18} className="text-terracotta-600" />
                </div>
                <div className="font-medium text-black mb-1">Answer Guided Questions</div>
                <div className="text-sm text-black/70">
                  We’ll ask specific questions to build your listing.
                </div>
              </button>
            </div>

            <div className="text-center pt-4">
              <button onClick={() => setStep(1)} className="text-sm text-black/70 underline">
                Start from scratch instead
              </button>
            </div>
          </div>
        )}

        {/* Step 0.A - Describe Your Experience */}
        {step === 0 && mode === 'describe' && (
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
              className="w-full min-h-[160px] border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
              placeholder="Example: A sunset heritage walk through old Bangalore markets where we discover century‑old spice merchants, family‑run sweet shops, and hidden temples..."
            />
            <div className="mt-2 text-xs text-black/60">0 characters · The more detail, the better the draft</div>
            <div className="mt-4 flex items-center gap-3">
              <button className="flex-1 bg-black text-white rounded-lg py-2 hover:bg-black/90 inline-flex items-center justify-center gap-2">
                <Icon as={Sparkles} size={16} className="text-white" />
                Generate My Experience
              </button>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Skip
              </button>
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

        {/* Step 0.B - Guided Questions (placeholder) */}
        {step === 0 && mode === 'guided' && (
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
            <h3 className="text-xl font-semibold text-black mb-2">Let’s Build Together</h3>
            <p className="text-black/70 mb-6">
              We’ll ask you a few questions to understand your experience.
            </p>
            <div className="rounded-lg border bg-gray-50 p-6 text-black/70">
              Coming soon: Interactive Q&amp;A flow
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button className="flex-1 bg-black text-white rounded-lg py-2 hover:bg-black/90 inline-flex items-center justify-center gap-2">
                <Icon as={Sparkles} size={16} className="text-white" />
                Generate My Experience
              </button>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        {step > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= n ? 'bg-terracotta-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>
            <span className="text-sm text-black/70">Step {step} of 4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-terracotta-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
        )}

        {/* Card */}
        {step > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Experience Title * (minimum 10 characters)
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Mumbai Street Food Adventure with Local Guide"
                  className={fieldClasses(form.title.trim().length > 0 && form.title.trim().length < 10)}
                />
                <p className="text-xs text-gray-500 mt-1">{form.title.length}/10+ characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description * (minimum 100 characters)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe what makes your experience unique and exciting..."
                  className={fieldClasses(form.description.trim().length > 0 && form.description.trim().length < 100)}
                />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/100+ characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Category *</label>
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
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Duration (minutes) *</label>
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Experience Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Max Participants *</label>
                  <input
                    type="number"
                    value={form.maxCapacity}
                    onChange={(e) => setForm((p) => ({ ...p, maxCapacity: parseInt(e.target.value || '1', 10) }))}
                    min={1}
                    max={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Price per Person (₹) *</label>
                  <input
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
                  placeholder="e.g., Colaba, Bandra, Andheri"
                  className={fieldClasses(form.neighborhood.trim().length === 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2 inline-flex items-center gap-2">
                  <Icon as={MapPin} size={16} className="text-terracotta-600" />
                  <span>Meeting Point *</span>
                </label>
                <input
                  type="text"
                  value={form.meetingPoint}
                  onChange={(e) => setForm((p) => ({ ...p, meetingPoint: e.target.value }))}
                  placeholder="e.g., Gateway of India, Main Entrance"
                  className={fieldClasses(form.meetingPoint.trim().length === 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2 inline-flex items-center gap-2">
                  <Icon as={Clock} size={16} className="text-terracotta-600" />
                  <span>What to Expect * (min 50 chars)</span>
                </label>
                <textarea
                  value={form.whatToExpect}
                  onChange={(e) => setForm((p) => ({ ...p, whatToExpect: e.target.value }))}
                  rows={3}
                  placeholder="Describe the unique highlights and special moments..."
                  className={fieldClasses(form.whatToExpect.trim().length > 0 && form.whatToExpect.trim().length < 50)}
                />
                <p className="text-xs text-gray-500 mt-1">{(form.whatToExpect || '').length}/50+ characters</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Additional Information</h2>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Requirements & Prerequisites</label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
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
                  rows={3}
                  placeholder="Important information, cancellation policy, weather considerations, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black">Photos & Final Review</h2>

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
                <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to submit?</h3>
                <p className="text-sm text-green-800">
                  Save this as draft now and submit for review later from your dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Icon as={ChevronLeft} size={16} className="text-gray-700" />
              Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 inline-flex items-center gap-2"
              >
                Next
                <Icon as={ChevronRight} size={16} className="text-white" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  ← Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

