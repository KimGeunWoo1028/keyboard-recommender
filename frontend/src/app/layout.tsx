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

export const metadata: Metadata = {
  title: {
    default: "Keyboard Recommender",
    template: "%s · Keyboard Recommender",
  },
  description: "스위치, 플레이트, 폼 조합까지 고려한 맞춤 키보드 추천 서비스",
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
