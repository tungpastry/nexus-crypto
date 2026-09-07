import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "./components/theme/ThemeProvider";
import { DEFAULT_NEXUS_THEME } from "./config/theme";
import { getThemeBootstrapScript } from "./lib/themeBootstrap";
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
  metadataBase: new URL("http://localhost:3200"),
  title: "Nexus Crypto SaaS 2026",
  description:
    "Dual-theme crypto decision-support dashboard for the versioned Nexus Top 100 market universe.",
  openGraph: {
    title: "Nexus Crypto SaaS 2026",
    description:
      "Dual-theme crypto decision-support dashboard for the versioned Nexus Top 100 market universe.",
    siteName: "Nexus Crypto SaaS 2026",
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
  const themeBootstrap = getThemeBootstrapScript();

  return (
    <html lang="en" data-theme={DEFAULT_NEXUS_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[var(--bg-main)] text-[var(--text-main)] antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
