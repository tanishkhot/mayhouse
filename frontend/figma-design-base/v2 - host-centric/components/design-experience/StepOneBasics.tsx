import { ExperienceFormState } from "./types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowRight } from "lucide-react";

interface Props {
  formState: ExperienceFormState;
  updateFormState: (updates: Partial<ExperienceFormState>) => void;
  onNext: () => void;
}

export function StepOneBasics({ formState, updateFormState, onNext }: Props) {
  const canProceed = formState.title.length > 5 && formState.description.length > 50;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">1</div>
          <div className="flex-1 h-px bg-border" />
          <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">2</div>
          <div className="flex-1 h-px bg-border" />
          <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">3</div>
          <div className="flex-1 h-px bg-border" />
          <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">4</div>
        </div>
        <h2>Step 1: Basics</h2>
        <p className="text-muted-foreground">Define the core of your experience</p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Experience Title *</Label>
          <Input
            id="title"
            value={formState.title}
            onChange={(e) => updateFormState({ title: e.target.value })}
            placeholder="e.g., Sunset Heritage Walk Through Gandhi Bazaar"
            maxLength={80}
          />
          <p className="text-sm text-muted-foreground">
            {formState.title.length}/80 characters
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formState.description}
            onChange={(e) => updateFormState({ description: e.target.value })}
            placeholder="Paint a vivid picture. What makes this experience special? What will travelers discover, taste, or learn?"
            className="min-h-[200px] resize-none"
            maxLength={2000}
          />
          <p className="text-sm text-muted-foreground">
            {formState.description.length}/2000 characters · Min 50 characters
          </p>
        </div>

        {/* Category & Theme */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formState.category}
              onValueChange={(value) => updateFormState({ category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="culture">Culture & Heritage</SelectItem>
                <SelectItem value="food">Food & Culinary</SelectItem>
                <SelectItem value="nature">Nature & Outdoors</SelectItem>
                <SelectItem value="art">Art & Creativity</SelectItem>
                <SelectItem value="wellness">Wellness & Mindfulness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Input
              id="theme"
              value={formState.theme}
              onChange={(e) => updateFormState({ theme: e.target.value })}
              placeholder="e.g., Local Markets & Heritage"
            />
          </div>
        </div>

        {/* Duration & Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formState.duration}
              onChange={(e) => updateFormState({ duration: parseInt(e.target.value) || 0 })}
              min={30}
              max={480}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Max Group Size</Label>
            <Input
              id="capacity"
              type="number"
              value={formState.capacity}
              onChange={(e) => updateFormState({ capacity: parseInt(e.target.value) || 1 })}
              min={1}
              max={20}
            />
          </div>
        </div>

        {/* Neighborhood & Meeting Point */}
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input
            id="neighborhood"
            value={formState.neighborhood}
            onChange={(e) => updateFormState({ neighborhood: e.target.value })}
            placeholder="e.g., Gandhi Bazaar, Basavanagudi"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingPoint">Meeting Point (Brief)</Label>
          <Input
            id="meetingPoint"
            value={formState.meetingPoint}
            onChange={(e) => updateFormState({ meetingPoint: e.target.value })}
            placeholder="e.g., Basavanagudi Bull Temple, Main Entrance"
          />
          <p className="text-sm text-muted-foreground">
            You'll add detailed route information in Step 3: Logistics
          </p>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <Label htmlFor="requirements">What Should Travelers Bring or Know?</Label>
          <Textarea
            id="requirements"
            value={formState.requirements}
            onChange={(e) => updateFormState({ requirements: e.target.value })}
            placeholder="e.g., Comfortable walking shoes, sun protection, open mind and appetite"
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
        >
          Continue to Media
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
