import type { Metadata } from "next";
import { Lora, Lato } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { RoutePrefetcher } from "@/components/RoutePrefetcher";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mayhouse",
  description: "Mayhouse frontend",
  icons: {
    icon: [
      { url: "/logo2-nobg.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo2-nobg.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo2-nobg.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo2-nobg.png" />
      </head>
      <body className={`${lora.variable} ${lato.variable} font-sans antialiased`}>
        <Providers>
          <RoutePrefetcher />
          <WebVitalsReporter />
          <Navbar />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}