"use client";

import React from "react";
import { Web3Providers } from "./web3-providers";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <Web3Providers>{children}</Web3Providers>;
}