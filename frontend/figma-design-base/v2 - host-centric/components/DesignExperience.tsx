import { useState } from "react";
import { StepZeroKickstart } from "./design-experience/StepZeroKickstart";
import { StepOneBasics } from "./design-experience/StepOneBasics";
import { StepTwoMedia } from "./design-experience/StepTwoMedia";
import { StepThreeLogistics } from "./design-experience/StepThreeLogistics";
import { StepFourReview } from "./design-experience/StepFourReview";
import { QualityMeterBar } from "./design-experience/QualityMeterBar";
import { AIChatSidebar } from "./design-experience/AIChatSidebar";
import { ExperienceFormState } from "./design-experience/types";

type Step = "kickstart" | "basics" | "media" | "logistics" | "review";

export function DesignExperience() {
  const [currentStep, setCurrentStep] = useState<Step>("kickstart");
  const [formState, setFormState] = useState<ExperienceFormState>({
    // Basics
    title: "",
    description: "",
    category: "",
    theme: "",
    duration: 120,
    capacity: 6,
    neighborhood: "",
    meetingPoint: "",
    requirements: "",
    
    // Media
    coverImage: null,
    galleryImages: [],
    
    // Logistics
    route: null,
    scheduleSlots: [],
    basePrice: 0,
    
    // Policies
    ageRestriction: null,
    cancellationPolicy: "flexible",
    permits: [],
    
    // Meta
    qualityScore: 0,
    blockers: [],
  });

  const [chatOpen, setChatOpen] = useState(true);

  const handleKickstartComplete = (draftData: Partial<ExperienceFormState>) => {
    setFormState({ ...formState, ...draftData });
    setCurrentStep("basics");
  };

  const updateFormState = (updates: Partial<ExperienceFormState>) => {
    setFormState({ ...formState, ...updates });
  };

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  // Don't show quality meter or chat in kickstart
  if (currentStep === "kickstart") {
    return (
      <StepZeroKickstart
        onComplete={handleKickstartComplete}
        onSkip={() => setCurrentStep("basics")}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Quality Meter - Top Bar */}
      <QualityMeterBar formState={formState} currentStep={currentStep} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Primary Content */}
        <div className="flex-1 overflow-y-auto">
          {currentStep === "basics" && (
            <StepOneBasics
              formState={formState}
              updateFormState={updateFormState}
              onNext={() => handleStepChange("media")}
            />
          )}
          {currentStep === "media" && (
            <StepTwoMedia
              formState={formState}
              updateFormState={updateFormState}
              onNext={() => handleStepChange("logistics")}
              onBack={() => handleStepChange("basics")}
            />
          )}
          {currentStep === "logistics" && (
            <StepThreeLogistics
              formState={formState}
              updateFormState={updateFormState}
              onNext={() => handleStepChange("review")}
              onBack={() => handleStepChange("media")}
            />
          )}
          {currentStep === "review" && (
            <StepFourReview
              formState={formState}
              updateFormState={updateFormState}
              onBack={() => handleStepChange("logistics")}
              onPublish={() => {
                console.log("Publishing experience...", formState);
              }}
            />
          )}
        </div>

        {/* AI Chat Sidebar */}
        <AIChatSidebar
          formState={formState}
          updateFormState={updateFormState}
          currentStep={currentStep}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
