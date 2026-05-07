"use client";
import { useEffect, useRef } from "react";

interface Clinician {
  id: string; name: string; specialty?: string; address?: string;
  lat?: number; lng?: number; phone?: string; email?: string;
}

// Default center: Dhaka, Bangladesh
const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125];

export default function ClinicianMap({ clinicians }: { clinicians: Clinician[] }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamic import of Leaflet (client only)
    let L: any;
    let map: any;

    (async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      // Fix default icon paths in bundled environments
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current || mapRef.current) return;

      map = L.map(containerRef.current).setView(DEFAULT_CENTER, 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        maxZoom: 19,
      }).addTo(map);

      // Add markers
      clinicians.forEach(c => {
        if (!c.lat || !c.lng) return;
        const popup = `
          <div style="font-family: Arial, sans-serif; min-width: 180px;">
            <strong style="font-size: 14px;">${c.name}</strong><br/>
            ${c.specialty ? `<span style="color: #7c3aed; font-size: 12px;">${c.specialty}</span><br/>` : ""}
            ${c.address ? `<span style="color: #6b7280; font-size: 12px;">📍 ${c.address}</span><br/>` : ""}
            ${c.phone ? `<a href="tel:${c.phone}" style="font-size: 12px;">📞 ${c.phone}</a><br/>` : ""}
            ${c.email ? `<a href="mailto:${c.email}" style="font-size: 12px;">✉️ ${c.email}</a>` : ""}
          </div>
        `;
        L.marker([c.lat, c.lng]).addTo(map).bindPopup(popup);
      });
    })();

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [clinicians]);

  return <div ref={containerRef} style={{ height: 450, width: "100%", background: "#1e1e2e" }} />;
}
