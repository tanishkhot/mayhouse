"use client";

import { useEffect, useState } from "react";
import { convertINRtoETH, formatETH, formatINR } from "@/lib/blockchain-api";

interface PriceDisplayProps {
  priceINR: number;
  showINR?: boolean;
  className?: string;
  size?: "small" | "medium" | "large";
}

/**
 * Component to display price in both ETH and INR
 * Fetches live conversion rates
 */
export default function PriceDisplay({
  priceINR,
  showINR = true,
  className = "",
  size = "medium",
}: PriceDisplayProps) {
  const [priceETH, setPriceETH] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const eth = await convertINRtoETH(priceINR);
        setPriceETH(eth);
      } catch (err) {
        console.error("Failed to convert INR to ETH:", err);
        setError("Failed to fetch price");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversion();
  }, [priceINR]);

  const sizeClasses = {
    small: {
      eth: "text-lg font-bold",
      inr: "text-sm",
    },
    medium: {
      eth: "text-2xl font-bold",
      inr: "text-base",
    },
    large: {
      eth: "text-4xl font-bold",
      inr: "text-lg",
    },
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        {showINR && <div className="h-4 bg-gray-200 rounded w-24"></div>}
      </div>
    );
  }

  if (error || priceETH === null) {
    return (
      <div className={className}>
        <div className={sizeClasses[size].eth}>{formatINR(priceINR)}</div>
        {showINR && (
          <div className={`${sizeClasses[size].inr} text-gray-500`}>
            ETH price unavailable
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`${sizeClasses[size].eth} text-gray-900`}>
        {formatETH(priceETH * 1e18)}
      </div>
      {showINR && (
        <div className={`${sizeClasses[size].inr} text-gray-500`}>
          {formatINR(priceINR)}
        </div>
      )}
    </div>
  );
}

