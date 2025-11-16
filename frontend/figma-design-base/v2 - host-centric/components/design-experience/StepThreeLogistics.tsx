import { useState } from "react";
import { ExperienceFormState, Route, Stop } from "./types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ArrowRight, ArrowLeft, MapPin, Plus, GripVertical, X, Clock } from "lucide-react";
import { Switch } from "../ui/switch";

interface Props {
  formState: ExperienceFormState;
  updateFormState: (updates: Partial<ExperienceFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepThreeLogistics({ formState, updateFormState, onNext, onBack }: Props) {
  const [isSingleLocation, setIsSingleLocation] = useState(
    formState.route?.isSingleLocation ?? true
  );

  const canProceed = formState.route?.meetingPoint && formState.basePrice > 0;

  // Initialize route if not exists
  if (!formState.route) {
    const initialRoute: Route = {
      meetingPoint: {
        name: formState.meetingPoint || "",
        lat: 12.9716,
        lng: 77.5946,
        landmark: "",
        arrivalInstructions: "",
      },
      stops: [],
      totalDuration: formState.duration,
      isSingleLocation: true,
    };
    updateFormState({ route: initialRoute });
  }

  const route = formState.route!;

  const updateRoute = (updates: Partial<Route>) => {
    updateFormState({
      route: { ...route, ...updates }
    });
  };

  const updateMeetingPoint = (updates: Partial<Route["meetingPoint"]>) => {
    updateRoute({
      meetingPoint: { ...route.meetingPoint, ...updates }
    });
  };

  const addStop = () => {
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      name: "",
      lat: route.meetingPoint.lat + Math.random() * 0.01,
      lng: route.meetingPoint.lng + Math.random() * 0.01,
      dwellMinutes: 15,
      notes: "",
    };
    updateRoute({ stops: [...route.stops, newStop] });
  };

  const removeStop = (id: string) => {
    updateRoute({ stops: route.stops.filter(s => s.id !== id) });
  };

  const updateStop = (id: string, updates: Partial<Stop>) => {
    updateRoute({
      stops: route.stops.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const calculateTotalDuration = () => {
    const travelTime = route.stops.length * 5; // 5 min between stops
    const dwellTime = route.stops.reduce((sum, s) => sum + s.dwellMinutes, 0);
    return travelTime + dwellTime;
  };

  const toggleLocationType = (single: boolean) => {
    setIsSingleLocation(single);
    updateRoute({ 
      isSingleLocation: single,
      stops: single ? [] : route.stops
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
          <div className="flex-1 h-px bg-primary" />
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
          <div className="flex-1 h-px bg-primary" />
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">3</div>
          <div className="flex-1 h-px bg-border" />
          <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">4</div>
        </div>
        <h2>Step 3: Logistics</h2>
        <p className="text-muted-foreground">Define your route, schedule, and pricing</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Route Planning */}
        <div className="space-y-6">
          <div>
            <h3>Route & Location</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Help travelers understand where they'll go
            </p>
          </div>

          {/* Location Type Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Single Location</Label>
              <p className="text-sm text-muted-foreground">
                Experience happens at one place
              </p>
            </div>
            <Switch
              checked={isSingleLocation}
              onCheckedChange={toggleLocationType}
            />
          </div>

          {/* Meeting Point */}
          <div className="space-y-4 p-4 bg-card border rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h4>Meeting Point *</h4>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="mp-name">Location Name</Label>
                <Input
                  id="mp-name"
                  value={route.meetingPoint.name}
                  onChange={(e) => updateMeetingPoint({ name: e.target.value })}
                  placeholder="e.g., Basavanagudi Bull Temple"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mp-landmark">Landmark or Building</Label>
                <Input
                  id="mp-landmark"
                  value={route.meetingPoint.landmark}
                  onChange={(e) => updateMeetingPoint({ landmark: e.target.value })}
                  placeholder="e.g., Main entrance, under the big banyan tree"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mp-instructions">Arrival Instructions</Label>
                <Textarea
                  id="mp-instructions"
                  value={route.meetingPoint.arrivalInstructions}
                  onChange={(e) => updateMeetingPoint({ arrivalInstructions: e.target.value })}
                  placeholder="e.g., Look for me wearing a blue Mayhouse cap near the ticket counter"
                  className="min-h-[60px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="mp-lat">Latitude</Label>
                  <Input
                    id="mp-lat"
                    type="number"
                    step="0.000001"
                    value={route.meetingPoint.lat}
                    onChange={(e) => updateMeetingPoint({ lat: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mp-lng">Longitude</Label>
                  <Input
                    id="mp-lng"
                    type="number"
                    step="0.000001"
                    value={route.meetingPoint.lng}
                    onChange={(e) => updateMeetingPoint({ lng: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stops (if multi-location) */}
          {!isSingleLocation && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4>Route Stops</h4>
                <Button size="sm" variant="outline" onClick={addStop}>
                  <Plus className="size-4 mr-1" />
                  Add Stop
                </Button>
              </div>

              {route.stops.length === 0 ? (
                <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <p className="text-sm">No stops yet. Add your first stop to build the route.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {route.stops.map((stop, idx) => (
                    <div key={stop.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="size-4 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Stop {idx + 1}</span>
                            <div className="flex-1" />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStop(stop.id)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>

                          <Input
                            value={stop.name}
                            onChange={(e) => updateStop(stop.id, { name: e.target.value })}
                            placeholder="Stop name"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Dwell Time (min)</Label>
                              <Input
                                type="number"
                                value={stop.dwellMinutes}
                                onChange={(e) => updateStop(stop.id, { dwellMinutes: parseInt(e.target.value) || 0 })}
                                min={0}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Accessibility</Label>
                              <Input
                                value={stop.accessibilityNotes || ""}
                                onChange={(e) => updateStop(stop.id, { accessibilityNotes: e.target.value })}
                                placeholder="Stairs, etc"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {route.stops.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <Clock className="size-4 text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Estimated route duration: ~{calculateTotalDuration()} minutes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Map Preview & Other Details */}
        <div className="space-y-6">
          {/* Map Preview */}
          <div className="space-y-2">
            <Label>Map Preview</Label>
            <div className="aspect-square rounded-lg border bg-muted/30 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="size-12 mx-auto mb-2" />
                <p className="text-sm">Interactive map coming soon</p>
                <p className="text-xs mt-1">
                  {route.meetingPoint.name || "Set meeting point to see preview"}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div>
              <h4>Pricing</h4>
              <p className="text-sm text-muted-foreground">
                Base price per person
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePrice">Price (₹) *</Label>
              <Input
                id="basePrice"
                type="number"
                value={formState.basePrice || ""}
                onChange={(e) => updateFormState({ basePrice: parseInt(e.target.value) || 0 })}
                placeholder="1500"
                min={0}
              />
            </div>

            {formState.basePrice > 0 && (
              <div className="p-3 bg-muted/30 rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traveler pays:</span>
                  <span>₹{formState.basePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (20%):</span>
                  <span>₹{Math.round(formState.basePrice * 0.2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span>You earn:</span>
                  <span>₹{Math.round(formState.basePrice * 0.8)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Placeholder */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4>Schedule</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You'll create your first schedule slots after publishing this template
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Media
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
        >
          Continue to Review
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
