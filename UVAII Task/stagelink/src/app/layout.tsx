import type { Metadata } from "next";
import { Outfit, Geist, Newsreader, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarSpacer } from "@/components/layout/NavbarSpacer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { OnboardingGate } from "@/components/OnboardingGate";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "StageLink | The Entertainment Talent Network",
  description: "Discover talent, build your professional portfolio, and get hired in the entertainment industry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        geist.variable,
        outfit.variable,
        newsreader.variable,
        syne.variable,
      )}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col overflow-x-hidden">
        <ScrollToTop />
        <OnboardingGate />
        <Navbar />
        <NavbarSpacer />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}