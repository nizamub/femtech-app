"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/dictionaries";
import type { Clinician } from "@/db/schema";

const SPECIALTY_COLORS: Record<string, string> = {
  "Gynecology":       "#EC4899",
  "Obstetrics":       "#A855F7",
  "Endocrinology":    "#06B6D4",
  "Cardiology":       "#EF4444",
  "Internal Medicine":"#10B981",
  "Dermatology":      "#F59E0B",
  "Haematology":      "#8B5CF6",
  "Nephrology":       "#3B82F6",
  "default":          "#6366F1",
};

export default function CliniciansMapClient({ clinicians, lang }: { clinicians: Clinician[]; lang: Locale }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [filter, setFilter] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const isBn = lang === "bn";

  const specialties = ["all", ...Array.from(new Set(clinicians.map(c => c.specialty).filter(Boolean))) as string[]];

  const filtered = clinicians.filter(c =>
    (filter === "all" || c.specialty === filter) &&
    (!verifiedOnly || c.verified)
  );

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let L: any;
    let map: any;

    const initMap = async () => {
      // Dynamically import leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Dynamic import
      L = (await import("leaflet")).default;

      // Fix default icon path issues in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });

      if (mapInstance.current) mapInstance.current.remove();

      map = L.map(mapRef.current!).setView([23.8103, 90.4125], 7); // Bangladesh center
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Add markers
      filtered.forEach(c => {
        if (!c.lat || !c.lng) return;
        const color = SPECIALTY_COLORS[c.specialty ?? ""] ?? SPECIALTY_COLORS.default;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);${!c.verified ? "opacity:0.5" : ""}"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const popup = L.popup({ maxWidth: 260 }).setContent(`
          <div style="font-family:system-ui;padding:0.25rem">
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.25rem">${c.name}</div>
            ${c.verified ? '<span style="font-size:0.7rem;padding:0.15rem 0.4rem;background:#10B981;color:white;border-radius:99px;font-weight:600">✓ Verified</span>' : '<span style="font-size:0.7rem;color:#999">Unverified</span>'}
            ${c.specialty ? `<div style="font-size:0.82rem;color:#666;margin-top:0.4rem">🏥 ${c.specialty}</div>` : ""}
            ${c.address ? `<div style="font-size:0.78rem;color:#888;margin-top:0.2rem">📍 ${c.address}</div>` : ""}
            ${c.phone ? `<div style="font-size:0.78rem;margin-top:0.2rem">📞 <a href="tel:${c.phone}" style="color:#C2185B">${c.phone}</a></div>` : ""}
            ${c.email ? `<div style="font-size:0.78rem">✉️ <a href="mailto:${c.email}" style="color:#C2185B">${c.email}</a></div>` : ""}
          </div>
        `);

        L.marker([c.lat, c.lng], { icon }).bindPopup(popup).addTo(map);
      });
    };

    initMap().catch(console.error);

    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [filtered.length, filter, verifiedOnly]);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input"
          style={{ maxWidth: 220 }}
        >
          {specialties.map(s => (
            <option key={s} value={s}>{s === "all" ? (isBn ? "সব বিশেষজ্ঞ" : "All Specialties") : s}</option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
          <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
          {isBn ? "শুধু যাচাইকৃত" : "Verified only"}
        </label>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length} {isBn ? "চিকিৎসক" : "clinicians"}
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {Object.entries(SPECIALTY_COLORS).filter(([k]) => k !== "default").map(([specialty, color]) => (
          <div key={specialty} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            {specialty}
          </div>
        ))}
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ height: 520, borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }} />

      {/* Clinician list */}
      <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "0.75rem" }}>
        {filtered.map(c => {
          const color = SPECIALTY_COLORS[c.specialty ?? ""] ?? SPECIALTY_COLORS.default;
          return (
            <div key={c.id} className="card" style={{ borderLeft: `3px solid ${color}` }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{c.name}</div>
              {c.verified && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 99 }}>✓ Verified</span>}
              {c.specialty && <div style={{ fontSize: "0.82rem", color, marginTop: "0.35rem" }}>{c.specialty}</div>}
              {c.address && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>📍 {c.address}</div>}
              {c.phone && <div style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>📞 {c.phone}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
