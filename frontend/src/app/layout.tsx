import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ALLIOME — Engineer the right ecosystem",
    template: "%s · ALLIOME",
  },
  description:
    "ALLIOME is the AI Ecosystem Architect: it finds the right partners, proves why they fit, and turns market-entry opportunities into actionable joint business plans.",
  applicationName: "ALLIOME",
  authors: [{ name: "ALLIOME" }],
  keywords: [
    "AI ecosystem architect",
    "partner ecosystem",
    "market entry",
    "partner discovery",
    "channel strategy",
    "ecosystem intelligence",
  ],
  openGraph: {
    title: "ALLIOME — Engineer the right ecosystem",
    description:
      "The AI Ecosystem Architect. Discover the right partners. Prove the fit. Engineer the ecosystem. Activate new revenue channels.",
    siteName: "ALLIOME",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F0E5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
