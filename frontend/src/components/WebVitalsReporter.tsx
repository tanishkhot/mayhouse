"use client";

import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";

type WebVitalsPayload = {
  id: string;
  name: string;
  value: number;
  url: string;
  ts: number;
  navigationType?: string;
};

export function WebVitalsReporter() {
  const seenRef = useRef<Record<string, number>>({});
  const summaryLoggedRef = useRef<boolean>(false);

  const logSummary = (reason: "load" | "hidden" | "beforeunload") => {
    if (typeof window === "undefined") return;
    if (summaryLoggedRef.current) return;
    summaryLoggedRef.current = true;

    const url = window.location.href;
    const ts = Date.now();

    const summary = {
      url,
      ts,
      reason,
      metrics: {
        TTFB: seenRef.current.TTFB,
        FCP: seenRef.current.FCP,
        LCP: seenRef.current.LCP,
        CLS: seenRef.current.CLS,
        INP: seenRef.current.INP,
      },
      missing: ["TTFB", "FCP", "LCP", "CLS", "INP"].filter(
        (k) => typeof (seenRef.current as any)[k] !== "number"
      ),
    };

    console.log("[WEB_VITALS_SUMMARY]", summary);
  };

  useReportWebVitals((metric) => {
    if (typeof window === "undefined") return;

    const payload: WebVitalsPayload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      url: window.location.href,
      ts: Date.now(),
      navigationType: (metric as any).navigationType,
    };

    // Dev-focused: log on every load/navigation
    console.log("[WEB_VITALS]", payload);

    // Keep the latest value for summary output
    seenRef.current[payload.name] = payload.value;
  });

  useEffect(() => {
    const onLoad = () => logSummary("load");
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logSummary("hidden");
      }
    };
    const onBeforeUnload = () => logSummary("beforeunload");

    window.addEventListener("load", onLoad, { once: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}


