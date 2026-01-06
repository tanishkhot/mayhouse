"use client";

import { RefObject } from "react";
import BookEventButton from "@/components/BookEventButton";
import PriceDisplay from "@/components/PriceDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

export type BookingSession = {
  dateTimeIso: string;
  label: string;
  availableSpots: number;
  isDisabled: boolean;
};

export function BookingSidebar({
  runId,
  sessions,
  selectedSessionIndex,
  setSelectedSessionIndex,
  availableSpotsFallback,
  hostWalletAddress,
  startDateTimeFallbackIso,
  priceINR,
  hasPrice,
  bookingAnchorRef,
}: {
  runId: string;
  sessions: BookingSession[];
  selectedSessionIndex: number;
  setSelectedSessionIndex: (idx: number) => void;
  availableSpotsFallback: number;
  hostWalletAddress?: string;
  startDateTimeFallbackIso: string;
  priceINR: number;
  hasPrice: boolean;
  bookingAnchorRef?: RefObject<HTMLDivElement | null>;
}) {
  const selectedSession =
    selectedSessionIndex >= 0 ? sessions[selectedSessionIndex] : null;

  return (
    <div className="lg:col-span-1">
      {bookingAnchorRef ? <div ref={bookingAnchorRef} /> : null}
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
              <p className="text-2xl font-semibold text-foreground">Price TBA</p>
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
              availableSeats={selectedSession?.availableSpots ?? availableSpotsFallback}
              hostWalletAddress={hostWalletAddress}
              eventTimestamp={selectedSession?.dateTimeIso ?? startDateTimeFallbackIso}
              priceINR={hasPrice ? priceINR : 0}
            />
          </div>

          <Separator />

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
        </CardContent>
      </Card>
    </div>
  );
}

export function MobileBookingBar({
  hasPrice,
  priceINR,
  isSoldOut,
  ensureSessionSelected,
  onScrollToBooking,
}: {
  hasPrice: boolean;
  priceINR: number;
  isSoldOut: boolean;
  ensureSessionSelected: () => void;
  onScrollToBooking: () => void;
}) {
  return (
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
            if (!isSoldOut) ensureSessionSelected();
            onScrollToBooking();
          }}
        >
          Book
        </Button>
      </div>
    </div>
  );
}


