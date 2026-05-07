import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aura — Modern Serenity & Wellness Tech",
    short_name: "Aura",
    description: "A comprehensive wellness and health assessment platform",
    start_url: "/en",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#065F46",
    orientation: "portrait-primary",
    categories: ["health", "medical"],
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Start Assessment",
        url: "/en/assessment",
        description: "Begin a new health assessment",
      },
      {
        name: "My Dashboard",
        url: "/en/dashboard",
        description: "View your health history",
      },
    ],
  };
}
