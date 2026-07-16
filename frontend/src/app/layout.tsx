import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { RuntimeApiGuards } from "@/components/providers/runtime-api-guards";
import { ThemeProvider } from "@/components/providers/theme-provider";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sharedDescription =
  "스위치, 플레이트, 폼, 레이아웃, 케이스, 키캡까지 고려해 나에게 맞는 키보드 구성을 추천합니다.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.keyboard-recommender.com"),
  title: {
    default: "Keyboard Recommender",
    template: "%s · Keyboard Recommender",
  },
  description: sharedDescription,
  alternates: {
    canonical: "https://www.keyboard-recommender.com",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.keyboard-recommender.com",
    siteName: "Keyboard Recommender",
    title: "Keyboard Recommender",
    description: sharedDescription,
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Keyboard Recommender",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keyboard Recommender",
    description: sharedDescription,
    images: ["/og/default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-body antialiased">
        <ThemeProvider>
          <RuntimeApiGuards>
            <AuthSessionProvider>
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
              </div>
            </AuthSessionProvider>
          </RuntimeApiGuards>
        </ThemeProvider>
      </body>
    </html>
  );
}
