import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "./components/theme/ThemeProvider";
import { DEFAULT_NEXUS_THEME, NEXUS_THEME_STORAGE_KEY } from "./config/theme";
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
    "Retro black-pink crypto SaaS dashboard for 10-asset market monitoring and Nexus checklist workflow.",
  openGraph: {
    title: "Nexus Crypto SaaS 2026",
    description:
      "Retro black-pink crypto SaaS dashboard for 10-asset market monitoring and Nexus checklist workflow.",
    url: "https://nexus-crypto.vercel.app",
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
  const themeBootstrap = `(()=>{try{const key=${JSON.stringify(
    NEXUS_THEME_STORAGE_KEY
  )};const saved=localStorage.getItem(key);const theme=saved==="wikipedia-glass"||saved==="black-pink"?saved:${JSON.stringify(
    DEFAULT_NEXUS_THEME
  )};document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme==="wikipedia-glass"?"light":"dark"}catch{document.documentElement.dataset.theme=${JSON.stringify(
    DEFAULT_NEXUS_THEME
  )}}})();`;

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
