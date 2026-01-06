"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExperiencePreviewDetail from "@/components/experience-preview/ExperiencePreviewDetail";
import type { NormalizedExperienceData, PhotoArray } from "@/lib/experience-preview-types";

type MockExperience = {
  id: string;
  title: string;
  location: string;
  category: string;
  durationMinutes: number;
  maxCapacity: number;
  priceInr: number;
  coverUrl: string;
  description: string;
  promise?: string;
  uniqueElement?: string;
  inclusions?: string[];
  whatToBring?: string[];
  whatToKnow?: string;
  safetyGuidelines?: string;
};

const MOCKS: Record<string, MockExperience> = {
  "1": {
    id: "1",
    title: "Hidden Stories of the Gothic Quarter",
    location: "Barcelona, Spain",
    category: "Culture",
    durationMinutes: 180,
    maxCapacity: 8,
    priceInr: 4500,
    coverUrl:
      "https://images.unsplash.com/photo-1761666520000-def67e58766e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxraW5nJTIwdG91cnxlbnwxfHx8fDE3NjIzNjE1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description:
      "Forget the tourist trail. Walk the Gothic Quarter like a local—through hidden courtyards, ancient walls, and stories you will not find on a guidebook.\n\nWe keep the group small, move at an easy pace, and pause often for the best viewpoints and photo moments.",
    promise: "Come for the sights. Leave with the stories.",
    uniqueElement:
      "A storytelling-first route designed around the quiet corners most people miss.",
    inclusions: ["Guided walk", "Local snack stop", "Digital neighborhood map"],
    whatToBring: ["Comfortable shoes", "A bottle of water", "Curiosity"],
    whatToKnow: "This experience is best enjoyed on foot and includes cobblestone streets.",
  },
  "2": {
    id: "2",
    title: "Authentic Vietnamese Street Food Journey",
    location: "Hanoi, Vietnam",
    category: "Food",
    durationMinutes: 240,
    maxCapacity: 6,
    priceInr: 3800,
    coverUrl:
      "https://images.unsplash.com/photo-1760049869567-e4ae462306f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMGZvb2QlMjBleHBlcmllbmNlfGVufDF8fHx8MTc2MjM2MTU3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description:
      "Eat your way through Hanoi with a host who knows the stalls locals trust. We'll taste classic street food, learn what to order, and understand the little rituals behind each bite.",
    promise: "Skip the guesswork. Taste the real thing.",
    inclusions: ["Tasting at multiple stalls", "Local recommendations", "Water"],
    whatToBring: ["An appetite", "Comfortable walking shoes"],
  },
  "3": {
    id: "3",
    title: "Traditional Pottery Workshop with Local Artisan",
    location: "Kyoto, Japan",
    category: "Arts",
    durationMinutes: 150,
    maxCapacity: 5,
    priceInr: 6500,
    coverUrl:
      "https://images.unsplash.com/photo-1500472141701-084e6fa44840?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwd29ya3Nob3B8ZW58MXx8fHwxNzYyMzYxNTcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description:
      "A hands-on pottery workshop where you learn the basics, then create a piece you can take home (or have fired and shipped). Perfect for first-timers and curious creatives.",
    promise: "Make something you will keep.",
    inclusions: ["Clay and tools", "Guided instruction", "Tea break"],
    whatToBring: ["Clothes you can get a little messy"],
  },
  "4": {
    id: "4",
    title: "Storyteller's Walk Through Harlem Heritage",
    location: "New York, USA",
    category: "Culture",
    durationMinutes: 120,
    maxCapacity: 8,
    priceInr: 4000,
    coverUrl:
      "https://images.unsplash.com/photo-1666617181888-40d6e700ba62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0b3J5dGVsbGluZ3xlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description:
      "Walk Harlem with a storyteller's lens—music, culture, civil rights, and the everyday places where history happened.",
    inclusions: ["Guided walk", "Curated stops", "Neighborhood recommendations"],
  },
  "5": {
    id: "5",
    title: "Dawn Market Tour & Cooking Class",
    location: "Jaipur, India",
    category: "Food",
    durationMinutes: 300,
    maxCapacity: 6,
    priceInr: 5500,
    coverUrl:
      "https://images.unsplash.com/photo-1743485753975-3175a37b2e80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRoZW50aWMlMjBsb2NhbCUyMG1hcmtldHxlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description:
      "Start early at a local market, pick ingredients like a local, then cook a comforting meal with guided techniques and stories.",
    inclusions: ["Market tour", "Cooking class", "Meal"],
    whatToKnow: "Starts early. You will be standing for extended periods.",
  },
  "6": {
    id: "6",
    title: "Community Garden & Urban Farming Experience",
    location: "Paris, France",
    category: "Nature",
    durationMinutes: 180,
    maxCapacity: 10,
    priceInr: 3500,
    coverUrl:
      "https://images.unsplash.com/photo-1625246433906-6cfa33544b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmd8ZW58MXx8fHwxNzYyMzUwNzk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description:
      "Spend a few hours in a community garden learning about urban farming, composting, and simple practices you can bring home.",
    inclusions: ["Hands-on garden session", "Tools provided"],
    whatToBring: ["Sun protection", "Closed-toe shoes"],
  },
};

const toDomain = (category: string) => category.toLowerCase();

export default function MockExperienceDetailPage() {
  const params = useParams();
  const mockId = typeof params?.mockId === "string" ? params.mockId : "";

  const mock = MOCKS[mockId];

  const experience = useMemo<NormalizedExperienceData | null>(() => {
    if (!mock) return null;
    return {
      id: `mock-${mock.id}`,
      title: mock.title,
      description: mock.description,
      promise: mock.promise,
      uniqueElement: mock.uniqueElement,
      domain: toDomain(mock.category),
      neighborhood: mock.location,
      duration: mock.durationMinutes,
      maxCapacity: mock.maxCapacity,
      price: mock.priceInr,
      inclusions: mock.inclusions,
      whatToBring: mock.whatToBring,
      whatToKnow: mock.whatToKnow,
      safetyGuidelines: mock.safetyGuidelines,
    };
  }, [mock]);

  const photos = useMemo<PhotoArray>(() => {
    if (!mock) return [];
    return [
      {
        id: `mock-${mock.id}-cover`,
        url: mock.coverUrl,
        isCover: true,
      },
    ];
  }, [mock]);

  if (!mock || !experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full py-0">
          <CardHeader className="px-6 pt-6 pb-0">
            <CardTitle className="text-foreground">Mock experience not found</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              This mock experience does not exist.
            </p>
            <div className="mt-5">
              <Button asChild variant="outline">
                <Link href="/explore">Back to explore</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            className="gap-2 transition-all duration-300 hover:bg-accent active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Link href="/explore" aria-label="Back to explore">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Explore</span>
            </Link>
          </Button>
        </div>
      </header>

      <ExperiencePreviewDetail
        experience={experience}
        photos={photos}
        host={null}
        mode="preview"
        showBookingPreview={true}
      />
    </div>
  );
}


