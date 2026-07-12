import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { AppProviders } from "@/components/providers/AppProviders";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { OfflineQueue } from "@/components/pwa/OfflineQueue";
import { InstallNudge } from "@/components/pwa/InstallNudge";
import { FooterBar } from "@/components/layout/FooterBar";
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
  title: "Ao Learner — English & German Speaking Practice",
  description:
    "Short speaking drills with a 3D AI tutor. Get pronunciation scores, instant feedback, and level up every day.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ao Learner",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1B4EF5",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="neo-grid-bg flex min-h-full flex-col text-neo-ink">
        <AppProviders>
          <Nav />
          <main className="flex-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
          <FooterBar />
          <RegisterSW />
          <OfflineQueue />
          <InstallNudge />
        </AppProviders>
      </body>
    </html>
  );
}
