import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
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
  title: "Ao Learner",
  description:
    "Learn English & German with a 3D AI tutor — speak, get scored, level up.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8e7",
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
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="neo-border border-x-0 border-b-0 bg-neo-ink px-4 py-3 text-center text-xs font-bold text-neo-yellow">
          Ao Learner · Speak · Score · Level up
        </footer>
      </body>
    </html>
  );
}
