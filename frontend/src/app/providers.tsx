"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

let queryClient: QueryClient | null = null;
function getClient() {
  if (!queryClient) {
    queryClient = new QueryClient();
  }
  return queryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>;
}