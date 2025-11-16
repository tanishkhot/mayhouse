import { ExperienceFormState, Blocker } from "./types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowLeft, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";

interface Props {
  formState: ExperienceFormState;
  updateFormState: (updates: Partial<ExperienceFormState>) => void;
  onBack: () => void;
  onPublish: () => void;
}

export function StepFourReview({ formState, updateFormState, onBack, onPublish }: Props) {
  // Calculate blockers
  const blockers: Blocker[] = [];

  if (!formState.title || formState.title.length < 10) {
    blockers.push({
      id: "title",
      field: "title",
      message: "Title must be at least 10 characters",
      severity: "error"
    });
  }

  if (!formState.description || formState.description.length < 100) {
    blockers.push({
      id: "description",
      field: "description",
      message: "Description must be at least 100 characters",
      severity: "error"
    });
  }

  if (!formState.coverImage) {
    blockers.push({
      id: "cover",
      field: "coverImage",
      message: "Cover image is required",
      severity: "error"
    });
  }

  if (!formState.route?.meetingPoint.name) {
    blockers.push({
      id: "meeting",
      field: "meetingPoint",
      message: "Meeting point location is required",
      severity: "error"
    });
  }

  if (!formState.route?.meetingPoint.landmark) {
    blockers.push({
      id: "landmark",
      field: "landmark",
      message: "Meeting point landmark helps travelers find you",
      severity: "warning"
    });
  }

  if (!formState.basePrice || formState.basePrice === 0) {
    blockers.push({
      id: "price",
      field: "basePrice",
      message: "Base price is required",
      severity: "error"
    });
  }

  if (formState.galleryImages.length < 3) {
    blockers.push({
      id: "gallery",
      field: "galleryImages",
      message: "Add at least 3 gallery images for better engagement",
      severity: "warning"
    });
  }

  const criticalBlockers = blockers.filter(b => b.severity === "error");
  const warnings = blockers.filter(b => b.severity === "warning");
  const canPublish = criticalBlockers.length === 0;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
          <div className="flex-1 h-px bg-primary" />
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
          <div className="flex-1 h-px bg-primary" />
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
          <div className="flex-1 h-px bg-primary" />
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">4</div>
        </div>
        <h2>Step 4: Review & Publish</h2>
        <p className="text-muted-foreground">Final checks before submitting for approval</p>
      </div>

      <div className="space-y-8">
        {/* Blockers Section */}
        {blockers.length > 0 && (
          <div className="space-y-3">
            <h3>Publish Checklist</h3>
            
            {criticalBlockers.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  {criticalBlockers.length} critical issue{criticalBlockers.length > 1 ? "s" : ""} must be resolved before publishing
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              {blockers.map(blocker => (
                <div
                  key={blocker.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    blocker.severity === "error" 
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" 
                      : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
                  }`}
                >
                  <AlertCircle className={`size-5 mt-0.5 ${
                    blocker.severity === "error" ? "text-red-600" : "text-yellow-600"
                  }`} />
                  <div className="flex-1">
                    <p className={`${
                      blocker.severity === "error" ? "text-red-700 dark:text-red-400" : "text-yellow-700 dark:text-yellow-400"
                    }`}>
                      {blocker.message}
                    </p>
                  </div>
                  <Badge variant={blocker.severity === "error" ? "destructive" : "secondary"}>
                    {blocker.severity === "error" ? "Required" : "Recommended"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {criticalBlockers.length === 0 && (
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CheckCircle2 className="size-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              All required fields are complete! Ready to publish.
            </AlertDescription>
          </Alert>
        )}

        {/* Policies */}
        <div className="space-y-4">
          <h3>Policies & Requirements</h3>

          <div className="space-y-4 p-4 bg-card border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="cancellation">Cancellation Policy *</Label>
              <Select
                value={formState.cancellationPolicy}
                onValueChange={(value: any) => updateFormState({ cancellationPolicy: value })}
              >
                <SelectTrigger id="cancellation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">
                    Flexible - Full refund 24h before
                  </SelectItem>
                  <SelectItem value="moderate">
                    Moderate - Full refund 48h before
                  </SelectItem>
                  <SelectItem value="strict">
                    Strict - Full refund 7 days before
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageRestriction">Minimum Age (optional)</Label>
              <Select
                value={formState.ageRestriction?.toString() || "none"}
                onValueChange={(value) => updateFormState({ 
                  ageRestriction: value === "none" ? null : parseInt(value)
                })}
              >
                <SelectTrigger id="ageRestriction">
                  <SelectValue placeholder="No age restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No age restriction</SelectItem>
                  <SelectItem value="13">13+ years</SelectItem>
                  <SelectItem value="16">16+ years</SelectItem>
                  <SelectItem value="18">18+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3>Experience Preview</h3>
            <Button variant="outline" size="sm">
              <Eye className="size-4 mr-2" />
              Full Preview
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {formState.coverImage && (
              <img 
                src={formState.coverImage} 
                alt={formState.title}
                className="w-full aspect-video object-cover"
              />
            )}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {formState.category && (
                    <Badge variant="secondary">{formState.category}</Badge>
                  )}
                  {formState.duration && (
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(formState.duration / 60)}h {formState.duration % 60}m
                    </span>
                  )}
                </div>
                <h3>{formState.title || "Untitled Experience"}</h3>
              </div>
              
              {formState.description && (
                <p className="text-muted-foreground line-clamp-3">
                  {formState.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  {formState.neighborhood && (
                    <p className="text-sm text-muted-foreground">{formState.neighborhood}</p>
                  )}
                </div>
                <div className="text-right">
                  {formState.basePrice > 0 && (
                    <p className="text-2xl">₹{formState.basePrice}</p>
                  )}
                  <p className="text-sm text-muted-foreground">per person</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="p-6 bg-muted/30 rounded-lg space-y-3">
          <h4>📋 What happens after you publish?</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              <span>Your experience will be submitted to the Mayhouse team for review</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              <span>We'll review within 48 hours and provide feedback if needed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              <span>Once approved, you can create schedule slots and start accepting bookings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">4.</span>
              <span>Your listing will go live on the Mayhouse platform</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Logistics
        </Button>
        <Button
          onClick={onPublish}
          disabled={!canPublish}
          size="lg"
        >
          {canPublish ? "Submit for Approval" : `Fix ${criticalBlockers.length} Issue${criticalBlockers.length > 1 ? "s" : ""} First`}
        </Button>
      </div>
    </div>
  );
}
