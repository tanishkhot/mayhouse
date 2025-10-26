"use client";

import { formatETH, formatINR } from "@/lib/blockchain-api";
import { useINRtoETH } from "@/hooks/useETHPrice";

interface PriceDisplayProps {
  priceINR: number;
  showINR?: boolean;
  className?: string;
  size?: "small" | "medium" | "large";
  layout?: "stacked" | "inline"; // stacked (default) or inline (x/y format)
}

/**
 * Component to display price in both ETH and INR
 * Uses cached ETH price for instant conversion
 */
export default function PriceDisplay({
  priceINR,
  showINR = true,
  className = "",
  size = "medium",
  layout = "stacked",
}: PriceDisplayProps) {
  const priceETH = useINRtoETH(priceINR);

  const sizeClasses = {
    small: {
      eth: "text-base font-semibold",
      inr: "text-xs",
    },
    medium: {
      eth: "text-xl font-bold",
      inr: "text-sm",
    },
    large: {
      eth: "text-3xl font-bold",
      inr: "text-base",
    },
  };

  // Format ETH to show appropriate decimal places
  const formatETHPrice = (eth: number) => {
    const weiValue = eth * 1e18;
    const ethString = formatETH(weiValue);
    // Remove the " ETH" suffix and format nicely
    return ethString.replace(' ETH', '');
  };

  // Inline format: "0.005 ETH / ₹1,000"
  if (layout === "inline") {
    return (
      <div className={`${className} flex items-center gap-1.5`}>
        <span className={`${sizeClasses[size].eth} text-gray-900`}>
          {formatETHPrice(priceETH)} ETH
        </span>
        {showINR && (
          <>
            <span className="text-gray-400">/</span>
            <span className={`${sizeClasses[size].inr} text-gray-600`}>
              {formatINR(priceINR)}
            </span>
          </>
        )}
      </div>
    );
  }

  // Stacked format (default)
  return (
    <div className={className}>
      <div className={`${sizeClasses[size].eth} text-gray-900`}>
        {formatETHPrice(priceETH)} ETH
      </div>
      {showINR && (
        <div className={`${sizeClasses[size].inr} text-gray-500`}>
          {formatINR(priceINR)}
        </div>
      )}
    </div>
  );
}


