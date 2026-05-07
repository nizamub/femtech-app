import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "উষা USHA — Women's Health Platform",
  description: "A digital health platform built for women of the Hill Tracts — expert consultations, health education, and nearby care.",
  keywords: "USHA, উষা, women health, Hill Tracts, Bangladesh, স্বাস্থ্য, diagnostic",
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
        <meta name="theme-color" content="#C2410C" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
