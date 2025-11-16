import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Sparkles, Link2, MessageSquare, ArrowRight } from "lucide-react";
import { ExperienceFormState } from "./types";

interface Props {
  onComplete: (draftData: Partial<ExperienceFormState>) => void;
  onSkip: () => void;
}

export function StepZeroKickstart({ onComplete, onSkip }: Props) {
  const [mode, setMode] = useState<"prompt" | "link" | "questions" | null>(null);
  const [promptText, setPromptText] = useState("");
  const [blogLink, setBlogLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock draft data
    const draftData: Partial<ExperienceFormState> = {
      title: "Sunset Heritage Walk Through Gandhi Bazaar",
      description: "Experience the soul of old Bangalore as we walk through the historic Gandhi Bazaar neighborhood during golden hour. Discover century-old spice merchants, family-run sweet shops, and hidden temples that locals cherish. This isn't just a tour—it's an intimate journey through stories, flavors, and the living heritage of South Bangalore.",
      category: "Culture & Heritage",
      theme: "Local Markets & Heritage",
      duration: 180,
      capacity: 8,
      neighborhood: "Gandhi Bazaar, Basavanagudi",
      meetingPoint: "Basavanagudi Bull Temple, Main Entrance",
      basePrice: 1500,
      qualityScore: 72,
    };
    
    setIsGenerating(false);
    onComplete(draftData);
  };

  if (mode === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/5 mb-2">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h1>Design Your Experience</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Tell us about the experience you want to create. Our AI will help you craft a compelling listing that attracts the right travelers.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="grid gap-4">
            <button
              onClick={() => setMode("prompt")}
              className="group p-6 rounded-lg border-2 border-border hover:border-primary transition-all text-left bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3>Describe Your Experience</h3>
                  <p className="text-muted-foreground mt-1">
                    Tell us in your own words. We'll handle the structure.
                  </p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setMode("link")}
              className="group p-6 rounded-lg border-2 border-border hover:border-primary transition-all text-left bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Link2 className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3>Paste a Blog Link</h3>
                  <p className="text-muted-foreground mt-1">
                    Have a blog post or article? We'll extract the key details.
                  </p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setMode("questions")}
              className="group p-6 rounded-lg border-2 border-border hover:border-primary transition-all text-left bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <MessageSquare className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3>Answer Guided Questions</h3>
                  <p className="text-muted-foreground mt-1">
                    We'll ask you specific questions to build your listing.
                  </p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>

          {/* Skip Option */}
          <div className="text-center pt-4">
            <Button variant="ghost" onClick={onSkip}>
              Start from scratch instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => setMode(null)}
            className="mb-2"
          >
            ← Back
          </Button>
          <h2>
            {mode === "prompt" && "Describe Your Experience"}
            {mode === "link" && "Paste Your Blog Link"}
            {mode === "questions" && "Let's Build Together"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "prompt" && "Share your vision in your own words. Include what makes it special, where it happens, and what travelers will experience."}
            {mode === "link" && "Paste a link to a blog post, article, or any content that describes your experience."}
            {mode === "questions" && "We'll ask you a few questions to understand your experience."}
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          {mode === "prompt" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Example: A sunset heritage walk through old Bangalore markets where we discover century-old spice merchants, family-run sweet shops, and hidden temples. We'll taste authentic South Indian snacks, learn about the neighborhood's evolution, and meet local artisans who've been here for generations..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {promptText.length} characters · The more detail, the better the draft
              </p>
            </div>
          )}

          {mode === "link" && (
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/my-experience"
                value={blogLink}
                onChange={(e) => setBlogLink(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                We'll extract context from blog posts, travel articles, or guides
              </p>
            </div>
          )}

          {mode === "questions" && (
            <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                Coming soon: Interactive Q&A flow
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (mode === "prompt" && promptText.length < 50) ||
              (mode === "link" && !blogLink)
            }
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Sparkles className="size-4 mr-2 animate-pulse" />
                Generating Draft...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Generate My Experience
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>

        {/* Example */}
        {mode === "prompt" && !promptText && (
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <p className="text-sm">💡 Example prompt:</p>
            <p className="text-sm text-muted-foreground italic">
              "I want to host a cooking class in my home where we make traditional Karnataka breakfast items like dosas, idlis, and chutneys. I'll share family recipes passed down three generations, and we'll shop for fresh ingredients at the local market first. Perfect for food lovers who want hands-on experience."
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
