import type { Metadata } from "next";
import { Lora, Lato } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { RoutePrefetcher } from "@/components/RoutePrefetcher";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${lato.variable} font-sans antialiased`}>
        <Providers>
          <RoutePrefetcher />
          <Navbar />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}