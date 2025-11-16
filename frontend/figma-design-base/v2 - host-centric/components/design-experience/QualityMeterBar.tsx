import { ExperienceFormState } from "./types";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";

interface Props {
  formState: ExperienceFormState;
  currentStep: string;
}

export function QualityMeterBar({ formState }: Props) {
  // Calculate quality pillars
  const pillars = {
    clarity: calculateClarity(formState),
    media: calculateMedia(formState),
    logistics: calculateLogistics(formState),
    policies: calculatePolicies(formState),
  };

  const overallScore = Math.round(
    (pillars.clarity + pillars.media + pillars.logistics + pillars.policies) / 4
  );

  const criticalBlockers = formState.blockers.filter(b => b.severity === "error").length;
  const warnings = formState.blockers.filter(b => b.severity === "warning").length;

  return (
    <div className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Overall Score */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Quality Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl ${
                  overallScore >= 80 ? "text-green-600" :
                  overallScore >= 60 ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {overallScore}%
                </span>
              </div>
            </div>
            <div className="w-24">
              <Progress value={overallScore} className="h-2" />
            </div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-border" />

          {/* Pillars */}
          <div className="flex items-center gap-4 flex-1">
            <Pillar name="Clarity" score={pillars.clarity} />
            <Pillar name="Media" score={pillars.media} />
            <Pillar name="Logistics" score={pillars.logistics} />
            <Pillar name="Policies" score={pillars.policies} />
          </div>

          {/* Blockers */}
          {(criticalBlockers > 0 || warnings > 0) && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                {criticalBlockers > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="size-3" />
                    {criticalBlockers} blocker{criticalBlockers > 1 ? "s" : ""}
                  </Badge>
                )}
                {warnings > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="size-3" />
                    {warnings} warning{warnings > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Pillar({ name, score }: { name: string; score: number }) {
  const Icon = score >= 80 ? CheckCircle2 : score >= 60 ? AlertTriangle : AlertCircle;
  const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex items-center gap-2">
      <Icon className={`size-4 ${color}`} />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{name}</span>
        <span className={`text-sm ${color}`}>{score}%</span>
      </div>
    </div>
  );
}

// Quality calculation helpers
function calculateClarity(state: ExperienceFormState): number {
  let score = 0;
  if (state.title.length > 10) score += 25;
  if (state.description.length > 100) score += 25;
  if (state.description.length > 300) score += 25;
  if (state.category) score += 15;
  if (state.neighborhood) score += 10;
  return Math.min(100, score);
}

function calculateMedia(state: ExperienceFormState): number {
  let score = 0;
  if (state.coverImage) score += 40;
  if (state.galleryImages.length >= 1) score += 20;
  if (state.galleryImages.length >= 3) score += 20;
  if (state.galleryImages.length >= 5) score += 20;
  return Math.min(100, score);
}

function calculateLogistics(state: ExperienceFormState): number {
  let score = 0;
  if (state.route?.meetingPoint) score += 30;
  if (state.route?.meetingPoint.landmark) score += 20;
  if (state.basePrice > 0) score += 25;
  if (state.scheduleSlots.length > 0) score += 25;
  return Math.min(100, score);
}

function calculatePolicies(state: ExperienceFormState): number {
  let score = 50; // Base score
  if (state.cancellationPolicy) score += 25;
  if (state.requirements.length > 0) score += 25;
  return Math.min(100, score);
}
