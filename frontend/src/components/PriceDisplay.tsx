"use client";

import { formatINR } from "@/lib/blockchain-api";
// import { formatETH, formatINR } from "@/lib/blockchain-api";
// import { useINRtoETH } from "@/hooks/useETHPrice";

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
  // INR-only mode: ETH conversion is intentionally disabled.
  // const priceETH = useINRtoETH(priceINR);

  const sizeClasses = {
    small: {
      inr: "text-sm font-semibold",
    },
    medium: {
      inr: "text-xl font-bold",
    },
    large: {
      inr: "text-3xl font-bold",
    },
  } as const;

  // NOTE: ETH formatting + conversion intentionally preserved below (commented out)
  // so it can be restored later if Web3 is re-enabled.
  //
  // const formatETHPrice = (eth: number) => {
  //   const weiValue = eth * 1e18;
  //   const ethString = formatETH(weiValue);
  //   return ethString.replace(" ETH", "");
  // };

  if (!showINR) return null;

  // Inline format: "INR"
  if (layout === "inline") {
    return (
      <div className={`${className} flex items-center gap-1.5`}>
        <span className={`${sizeClasses[size].inr} text-gray-900`}>{formatINR(priceINR)}</span>
      </div>
    );
  }

  // Stacked format (default): INR only
  return (
    <div className={className}>
      <div className={`${sizeClasses[size].inr} text-gray-900`}>{formatINR(priceINR)}</div>
    </div>
  );
}

// ======= Previous ETH+INR UI (preserved, but disabled) =======
// NOTE: Do NOT wrap JSX-containing examples in /* ... */ because JSX comments contain */ and will break parsing.
//
// const priceETH = useINRtoETH(priceINR);
//
// const sizeClasses = {
//   small: { eth: "text-base font-semibold", inr: "text-xs" },
//   medium: { eth: "text-xl font-bold", inr: "text-sm" },
//   large: { eth: "text-3xl font-bold", inr: "text-base" },
// };
//
// const formatETHPrice = (eth: number) => {
//   const weiValue = eth * 1e18;
//   const ethString = formatETH(weiValue);
//   return ethString.replace(" ETH", "");
// };
//
// if (layout === "inline") {
//   return (
//     <div className={`${className} flex items-center gap-1.5`}>
//       <span className={`${sizeClasses[size].eth} text-gray-900`}>
//         {formatETHPrice(priceETH)} ETH
//       </span>
//       {showINR && (
//         <>
//           <span className="text-gray-400">/</span>
//           <span className={`${sizeClasses[size].inr} text-gray-600`}>
//             {formatINR(priceINR)}
//           </span>
//         </>
//       )}
//     </div>
//   );
// }
//
// return (
//   <div className={className}>
//     <div className={`${sizeClasses[size].eth} text-gray-900`}>
//       {formatETHPrice(priceETH)} ETH
//     </div>
//     {showINR && (
//       <div className={`${sizeClasses[size].inr} text-gray-500`}>
//         {formatINR(priceINR)}
//       </div>
//     )}
//   </div>
// );

