import { ExperienceFormState } from "./types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { ArrowRight, ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  formState: ExperienceFormState;
  updateFormState: (updates: Partial<ExperienceFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTwoMedia({ formState, updateFormState, onNext, onBack }: Props) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const canProceed = formState.coverImage !== null;

  const handleCoverUpload = async () => {
    setUploadingCover(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock: use Unsplash placeholder
    updateFormState({ 
      coverImage: `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80` 
    });
    setUploadingCover(false);
  };

  const handleGalleryUpload = async () => {
    setUploadingGallery(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newImage = `https://images.unsplash.com/photo-1581371990644-57fc0a2f4f85?w=600&q=80`;
    updateFormState({ 
      galleryImages: [...formState.galleryImages, newImage] 
    });
    setUploadingGallery(false);
  };

  const removeGalleryImage = (index: number) => {
    const updated = formState.galleryImages.filter((_, i) => i !== index);
    updateFormState({ galleryImages: updated });
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✓</div>
          <div className="flex-1 h-px bg-primary" />
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">2</div>
          <div className="flex-1 h-px bg-border" />
          <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">3</div>
          <div className="flex-1 h-px bg-border" />
          <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">4</div>
        </div>
        <h2>Step 2: Media</h2>
        <p className="text-muted-foreground">Showcase your experience with great visuals</p>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* Cover Image */}
        <div className="space-y-3">
          <Label>Cover Image *</Label>
          <p className="text-sm text-muted-foreground">
            This is the first thing travelers see. Choose a high-quality image that captures the essence of your experience.
          </p>
          
          {formState.coverImage ? (
            <div className="relative rounded-lg overflow-hidden border aspect-video group">
              <img 
                src={formState.coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => updateFormState({ coverImage: null })}
                className="absolute top-3 right-3 size-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleCoverUpload}
              disabled={uploadingCover}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 bg-muted/30"
            >
              {uploadingCover ? (
                <>
                  <Upload className="size-8 text-muted-foreground animate-bounce" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="size-8 text-muted-foreground" />
                  <p className="text-sm">Click to upload cover image</p>
                  <p className="text-xs text-muted-foreground">Recommended: 16:9 ratio, min 1200x675px</p>
                </>
              )}
            </button>
          )}
        </div>

        {/* Gallery Images */}
        <div className="space-y-3">
          <Label>Gallery Images</Label>
          <p className="text-sm text-muted-foreground">
            Add 3-5 images that show different aspects of your experience. Recommended minimum: 3 images.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {formState.galleryImages.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                <img 
                  src={img} 
                  alt={`Gallery ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {formState.galleryImages.length < 8 && (
              <button
                onClick={handleGalleryUpload}
                disabled={uploadingGallery}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 bg-muted/30"
              >
                {uploadingGallery ? (
                  <Upload className="size-6 text-muted-foreground animate-bounce" />
                ) : (
                  <>
                    <ImageIcon className="size-6 text-muted-foreground" />
                    <p className="text-xs text-center px-2">Add image</p>
                  </>
                )}
              </button>
            )}
          </div>

          {formState.galleryImages.length < 3 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <span className="text-yellow-600 dark:text-yellow-500">⚠️</span>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Add at least 3 gallery images for better engagement. Experiences with multiple photos get 2x more bookings.
              </p>
            </div>
          )}
        </div>

        {/* Shot List Helper */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <h4>📸 Suggested Photo Types</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Meeting point landmark (helps travelers find you)</li>
            <li>• A moment during the experience (people engaged, not posed)</li>
            <li>• Key locations or stops along your route</li>
            <li>• Close-up of something unique (food, art, detail)</li>
            <li>• The group atmosphere or setting</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Basics
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
        >
          Continue to Logistics
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
