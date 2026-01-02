"use client";

import { useQuery } from "@tanstack/react-query";
import { EventRunAPI } from "@/lib/event-run-api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Share2,
  Shield,
  Star,
  Users,
} from "lucide-react";
import BookEventButton from "@/components/BookEventButton";
import PriceDisplay from "@/components/PriceDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPicker } from "@/components/ui/map-picker";

const formatCategoryLabel = (domain?: string | null) => {
  if (!domain) return "Experience";
  return domain
    .toString()
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDuration = (minutes?: number | null) => {
  if (!minutes || !Number.isFinite(minutes)) return "Duration TBA";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDateTimeShort = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export default function ExperienceRunDetailPage() {
  const params = useParams();
  const runId = typeof params?.runId === "string" ? params.runId : "";
  const [isMounted, setIsMounted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const bookingAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch the specific event run details (includes experience info)
  const { data: eventRun, isLoading: eventRunLoading, error: eventRunError } = useQuery({
    queryKey: ["eventRun", runId],
    queryFn: () => EventRunAPI.getPublicEventRunDetails(runId),
    enabled: isMounted && !!runId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (matches global default)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Use cached data if available
    placeholderData: (previousData) => previousData, // Show previous data while refetching
  });

  // Note: We get all needed data from eventRun now, no need for separate experience fetch
  // The explore API only has mock data for exp_001 anyway
  
  const isLoading = !isMounted || !runId || eventRunLoading;

  // IMPORTANT: Hooks must run before any early returns. Keep selection state consistent
  // as eventRun loads/changes, without conditionally calling hooks.
  useEffect(() => {
    if (!eventRun) return;
    const available =
      eventRun.booking_summary?.available_spots ?? eventRun.max_capacity ?? 0;
    const soldOut = available <= 0;

    if (soldOut) {
      if (selectedSessionIndex !== -1) setSelectedSessionIndex(-1);
      return;
    }

    if (selectedSessionIndex < 0) setSelectedSessionIndex(0);
  }, [eventRun, selectedSessionIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Skeleton className="h-9 w-28 bg-muted" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md bg-muted" />
              <Skeleton className="h-9 w-9 rounded-md bg-muted" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <Skeleton className="w-full h-[280px] sm:h-[360px] lg:h-[420px] bg-muted" />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32 bg-muted" />
                <Skeleton className="h-10 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Skeleton className="h-6 w-28 rounded-full bg-muted" />
                  <Skeleton className="h-6 w-28 rounded-full bg-muted" />
                  <Skeleton className="h-6 w-28 rounded-full bg-muted" />
                </div>
              </div>

              <Card className="py-0">
                <CardContent className="px-6 py-6 space-y-3">
                  <Skeleton className="h-5 w-40 bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-5/6 bg-muted" />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="py-0 lg:sticky lg:top-24 shadow-lg">
                <CardContent className="px-6 py-6 space-y-5">
                  <Skeleton className="h-10 w-32 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <Separator />
                  <Skeleton className="h-24 w-full bg-muted" />
                  <Skeleton className="h-11 w-full bg-muted" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (eventRunError || !eventRun) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full py-0">
          <CardHeader className="px-6 pt-6 pb-0">
            <CardTitle className="text-foreground">Event run not found</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              The event you are looking for does not exist or has been removed.
            </p>
            <div className="mt-5">
              <Button
                asChild
                variant="outline"
                className="transition-all duration-300 active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Link href="/explore">Back to explore</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableSpots =
    eventRun.booking_summary?.available_spots ?? eventRun.max_capacity ?? 0;
  const isSoldOut = availableSpots <= 0;

  const title = eventRun.experience_title || "Experience";
  const category = formatCategoryLabel(eventRun.experience_domain);
  const duration = formatDuration(eventRun.duration_minutes);
  const maxParticipants = eventRun.max_capacity || 0;
  const locationLabel = eventRun.neighborhood || "Location TBA";
  const priceINR = Number(eventRun.price_inr ?? 0);
  const hasPrice = Number.isFinite(priceINR) && priceINR > 0;

  const coverPhotoUrl =
    typeof (eventRun as any)?.cover_photo_url === "string"
      ? ((eventRun as any).cover_photo_url as string)
      : null;

  const sessions = [
    {
      dateTimeIso: eventRun.start_datetime,
      label: formatDateTimeShort(eventRun.start_datetime),
      availableSpots,
      isDisabled: isSoldOut,
    },
  ];

  const selectedSession =
    selectedSessionIndex >= 0 ? sessions[selectedSessionIndex] : null;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
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

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="transition-all duration-300 hover:bg-accent active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="Share"
              onClick={() => {}}
            >
              <Share2 className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="transition-all duration-300 hover:bg-accent active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              onClick={() => setIsFavorited((v) => !v)}
            >
              <Heart
                className={
                  isFavorited
                    ? "h-5 w-5 fill-destructive text-destructive transition-all duration-200"
                    : "h-5 w-5 text-foreground transition-all duration-200"
                }
              />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative w-full h-[280px] sm:h-[360px] lg:h-[420px]">
            {coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPhotoUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm border-border text-foreground shadow-sm"
                >
                  {category}
                </Badge>

                {isSoldOut ? (
                  <Badge
                    variant="outline"
                    className="border-destructive text-destructive bg-background/90 backdrop-blur-sm"
                  >
                    Sold out
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-chart-1 text-chart-1 bg-background/90 backdrop-blur-sm gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {availableSpots} spots left
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{locationLabel}</span>
                  </div>

                  <span className="hidden sm:inline">|</span>

                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-chart-1 text-chart-1" />
                    <span>New</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-2">
                  <Clock className="h-3 w-3" />
                  {duration}
                </Badge>

                <Badge variant="outline" className="gap-2">
                  <Users className="h-3 w-3" />
                  Max {maxParticipants} people
                </Badge>

                <Badge variant="outline" className="gap-2">
                  <Calendar className="h-3 w-3" />
                  {formatDateTimeShort(eventRun.start_datetime)}
                </Badge>
              </div>
            </div>

            <Card className="py-0 transition-all duration-300 hover:shadow-lg">
              <CardContent className="px-6 py-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {(eventRun.host_name || "H").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {eventRun.host_name || "Host"}
                      </p>
                      <Shield className="h-4 w-4 text-chart-1 flex-shrink-0" />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Hosted by {eventRun.host_name || "Host"}
                    </p>

                    {eventRun.host_meeting_instructions ? (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {eventRun.host_meeting_instructions}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Host details coming soon.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-0">
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-foreground">What you will do</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Experience details coming soon.
                </p>
              </CardContent>
            </Card>

            <Card className="py-0">
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-foreground">
                  Meeting point and logistics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{eventRun.neighborhood || "Location TBA"}</span>
                </div>

                {eventRun.meeting_landmark && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Meeting landmark</p>
                    <p>{eventRun.meeting_landmark}</p>
                  </div>
                )}

                {eventRun.meeting_point_details && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Meeting details</p>
                    <p className="whitespace-pre-line">{eventRun.meeting_point_details}</p>
                  </div>
                )}

                {eventRun.latitude != null && 
                 eventRun.longitude != null && 
                 typeof eventRun.latitude === 'number' && 
                 typeof eventRun.longitude === 'number' &&
                 !isNaN(eventRun.latitude) &&
                 !isNaN(eventRun.longitude) && (
                  <div className="w-full">
                    <MapPicker
                      value={{
                        lat: eventRun.latitude,
                        lng: eventRun.longitude,
                        name: eventRun.meeting_landmark || eventRun.neighborhood || "Meeting point",
                      }}
                      readOnly={true}
                      height="300px"
                      className="rounded-lg border border-border"
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                    <span>Full refund up to 24h before</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                    <span>Secure payment escrow</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                    <span>20% refundable stake held until completion</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div ref={bookingAnchorRef} />
            <Card className="py-0 lg:sticky lg:top-24 shadow-lg">
              <CardContent className="px-6 py-6 space-y-6">
                <div>
                  {hasPrice ? (
                    <PriceDisplay
                      priceINR={priceINR}
                      size="large"
                      layout="stacked"
                      className="flex flex-col items-start"
                    />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      Price TBA
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">per person</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Choose a date</p>

                  <div className="grid gap-2">
                    {sessions.map((s, idx) => {
                      const isSelected = selectedSessionIndex === idx;
                      const isDisabled = s.isDisabled;

                      const base =
                        "w-full rounded-lg p-3 text-left transition-all duration-300 active:scale-95 active:duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
                      const state = isDisabled
                        ? "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border hover:bg-accent hover:border-ring";

                      return (
                        <button
                          key={s.dateTimeIso}
                          type="button"
                          disabled={isDisabled}
                          className={`${base} ${state}`}
                          onClick={() => {
                            if (isDisabled) return;
                            setSelectedSessionIndex(idx);
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{s.label}</p>
                              <p className="text-xs opacity-90">
                                {isDisabled
                                  ? "Sold out"
                                  : `${s.availableSpots} spots available`}
                              </p>
                            </div>
                            {hasPrice ? (
                              <PriceDisplay
                                priceINR={priceINR}
                                size="small"
                                layout="inline"
                                className="text-sm"
                              />
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <BookEventButton
                    eventRunId={runId}
                    availableSeats={
                      selectedSession?.availableSpots ?? availableSpots
                    }
                    hostWalletAddress={eventRun.host_wallet_address || undefined}
                    eventTimestamp={
                      selectedSession?.dateTimeIso ?? eventRun.start_datetime
                    }
                    priceINR={hasPrice ? priceINR : 0}
                  />

                  {/* <p className="text-xs text-muted-foreground text-center">
                    Includes 20% refundable stake
                  </p> */}
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                    <span>Full refund up to 24h before</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                    <span>Host verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">From</p>
            {hasPrice ? (
              <p className="text-base font-semibold text-foreground truncate">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(priceINR)}
              </p>
            ) : (
              <p className="text-base font-semibold text-foreground">Price TBA</p>
            )}
          </div>

          <Button
            type="button"
            className="flex-1 transition-all duration-300 active:scale-95 active:duration-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => {
              if (!isSoldOut && selectedSessionIndex < 0) {
                setSelectedSessionIndex(0);
              }
              bookingAnchorRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            Book
          </Button>
        </div>
      </div>
    </div>
  );
}