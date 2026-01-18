"use client";

import { useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Star,
  Users,
} from "lucide-react";
import type { NormalizedExperienceData, PhotoArray } from "@/lib/experience-preview-types";
import { formatDuration, formatPrice, getCategoryDisplayName } from "@/lib/experience-preview-normalizer";
import type { PublicProfile, UserResponse } from "@/lib/api";
import type { ExperienceStatus } from "@/lib/experience-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPicker, type Waypoint } from "@/components/ui/map-picker";
import ImageGallery from "./ImageGallery";

type PreviewHost = UserResponse | PublicProfile;

const getStatusColor = (status?: ExperienceStatus) => {
  switch (status) {
    case "draft":
      return "bg-muted text-muted-foreground";
    case "submitted":
      return "bg-accent text-foreground";
    case "approved":
      return "bg-primary text-primary-foreground";
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    case "archived":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status?: ExperienceStatus) => {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    default:
      return "Unknown";
  }
};

export default function ExperiencePreviewDetail({
  experience,
  photos = [],
  host,
  mode = "preview",
  showStatus = false,
  status,
  showBookingPreview = true,
}: {
  experience: NormalizedExperienceData;
  photos?: PhotoArray;
  host?: PreviewHost | null;
  mode?: "preview" | "saved";
  showStatus?: boolean;
  status?: ExperienceStatus;
  showBookingPreview?: boolean;
}) {
  const cover = useMemo(() => photos.find((p) => p.isCover) || photos[0], [photos]);

  const galleryImages = useMemo(() => {
    const safe = photos.length
      ? photos
      : cover?.url
        ? [{ id: cover.id, url: cover.url, isCover: true }]
        : [];

    return safe.map((p) => ({
      id: p.id,
      url: p.url,
      alt: experience.title,
    }));
  }, [photos, cover, experience.title]);

  const hostName = host?.full_name || "Host";
  const hostInitial = (hostName || "H").slice(0, 1).toUpperCase();
  const hostBio = host?.bio || null;
  const hostLanguages =
    host && "host_application" in host ? host.host_application?.languages_spoken : undefined;

  const capacityLabel = experience.maxCapacity
    ? `Max ${experience.maxCapacity} people`
    : experience.minCapacity
      ? `Min ${experience.minCapacity} people`
      : "Capacity TBA";

  const locationLabel = experience.neighborhood || "Location TBA";

  const routeWaypoints = experience.routeData?.waypoints ?? [];
  const canShowRoute = Array.isArray(routeWaypoints) && routeWaypoints.length > 0;

  const defaultCenter =
    routeWaypoints[0]?.lat != null && routeWaypoints[0]?.lng != null
      ? { lat: routeWaypoints[0].lat, lng: routeWaypoints[0].lng }
      : experience.latitude != null && experience.longitude != null
        ? { lat: experience.latitude, lng: experience.longitude }
        : undefined;

  return (
    <div className="bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        <div className="relative">
          <ImageGallery
            images={galleryImages}
            aspectClassName="h-[280px] sm:h-[360px] lg:h-[420px]"
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
              {showStatus && status ? (
                <span
                  className={`pointer-events-auto px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    status,
                  )}`}
                >
                  {getStatusLabel(status)}
                </span>
              ) : null}

              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm border-border text-foreground shadow-sm"
              >
                {getCategoryDisplayName(experience.domain)}
              </Badge>

              {experience.price > 0 ? (
                <Badge
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm border-border text-foreground shadow-sm gap-1"
                >
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {formatPrice(experience.price)}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm border-border text-foreground shadow-sm"
                >
                  Price TBA
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div>
                <h1
                  id="modal-title"
                  className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground"
                >
                  {experience.title}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{locationLabel}</span>
                  </div>

                  <span className="hidden sm:inline">|</span>

                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span>Preview</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDuration(experience.duration)}
                </Badge>

                <Badge variant="outline" className="gap-2">
                  <Users className="h-3 w-3" />
                  {capacityLabel}
                </Badge>

                <Badge variant="outline" className="gap-2">
                  <Calendar className="h-3 w-3" />
                  Scheduling after publish
                </Badge>
              </div>
            </div>

            <Card className="py-0 transition-all duration-300 hover:shadow-lg">
              <CardContent className="px-6 py-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {hostInitial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {hostName}
                      </p>
                      <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    </div>

                    {hostBio ? (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {hostBio}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Host bio coming soon.
                      </p>
                    )}

                    {hostLanguages && hostLanguages.length > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Speaks {hostLanguages.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-0">
              <CardHeader className="px-6 pt-6 pb-0">
                <CardTitle className="text-foreground">What you will do</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <p
                  id="modal-description"
                  className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                >
                  {experience.description || "Experience details coming soon."}
                </p>

                {experience.promise ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{experience.promise}&quot;
                    </p>
                  </div>
                ) : null}

                {experience.uniqueElement ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-medium text-foreground mb-1">
                      What makes this unique
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {experience.uniqueElement}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {experience.inclusions && experience.inclusions.length > 0 ? (
              <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">What is included</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {experience.inclusions.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {experience.whatToBring && experience.whatToBring.length > 0 ? (
              <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">What to bring</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {experience.whatToBring.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-3">
                        <span className="mt-0.5 h-5 w-5 rounded-full border border-border bg-background flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {experience.whatToKnow ? (
              <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">Good to know</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {experience.whatToKnow}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {experience.safetyGuidelines ? (
              <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">Safety guidelines</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {experience.safetyGuidelines}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {canShowRoute ? (
              <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">Walking route</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-border">
                    <MapPicker
                      routeWaypoints={routeWaypoints as Waypoint[]}
                      readOnly={true}
                      showSearch={false}
                      height="400px"
                      defaultCenter={defaultCenter}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This route includes {routeWaypoints.length} waypoint
                    {routeWaypoints.length === 1 ? "" : "s"} for your walking experience.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {mode === "saved" && (experience.adminFeedback || experience.moderatorFeedback) ? (
              <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-0">
                  <CardTitle className="text-foreground">Feedback</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-3">
                  {experience.moderatorFeedback ? (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Moderator feedback
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {experience.moderatorFeedback}
                      </p>
                    </div>
                  ) : null}

                  {experience.adminFeedback ? (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Admin feedback
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {experience.adminFeedback}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <Card className="py-0 lg:sticky lg:top-24 shadow-lg">
              <CardContent className="px-6 py-6 space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {experience.price > 0 ? formatPrice(experience.price) : "Price TBA"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">per person</p>
                </div>

                <Separator />

                {experience.meetingPoint ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Meeting point</p>
                    <p className="text-sm text-muted-foreground">
                      {experience.meetingPoint}
                    </p>
                    {experience.meetingPointDetails ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {experience.meetingPointDetails}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full refund up to 24h before</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Host verified</span>
                  </div>
                </div>

                {showBookingPreview ? (
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Booking preview
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Booking is available on the Explore page after scheduling a run.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


