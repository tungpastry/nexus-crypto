import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "⚡ Nexus Crypto Dashboard",
  description:
    "Real-time BTC/USDT Dashboard built with Next.js 16, TradingView, and AutoChecklist AI.",
  openGraph: {
    title: "⚡ Nexus Crypto Dashboard",
    description:
      "Real-time BTC/USDT Dashboard built with Next.js 16, TradingView, and AutoChecklist AI.",
    url: "https://nexus-crypto.vercel.app",
    siteName: "Nexus Crypto Dashboard",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexus Crypto Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
