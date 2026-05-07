import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura — Modern Serenity & Wellness Tech",
  description: "A comprehensive wellness and health assessment platform",
  keywords: "wellness, health, diagnostic, modern tech, Aura, স্বাস্থ্য",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#F8FAFC" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
