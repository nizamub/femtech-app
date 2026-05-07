"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/dictionaries";
import type { Clinician } from "@/db/schema";
import { Phone, Mail, MapPin, BadgeCheck, SlidersHorizontal } from "lucide-react";

const SPECIALTY_COLORS: Record<string, string> = {
  "Gynecology":        "#C2410C",  // USHA terracotta
  "Obstetrics":        "#9333EA",
  "Endocrinology":     "#0891B2",
  "Cardiology":        "#DC2626",
  "Internal Medicine": "#16A34A",
  "Dermatology":       "#D97706",
  "Haematology":       "#7C3AED",
  "Nephrology":        "#2563EB",
  "default":           "#6366F1",
};

// Tailwind badge bg & text per specialty (fallback: stone)
const SPECIALTY_TAILWIND: Record<string, { bg: string; text: string; dot: string }> = {
  "Gynecology":        { bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500"  },
  "Obstetrics":        { bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500"  },
  "Endocrinology":     { bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500"    },
  "Cardiology":        { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  "Internal Medicine": { bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500"   },
  "Dermatology":       { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  "Haematology":       { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500"  },
  "Nephrology":        { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  "default":           { bg: "bg-stone-100",   text: "text-stone-700",   dot: "bg-stone-400"   },
};

function getStyle(specialty?: string | null) {
  return SPECIALTY_TAILWIND[specialty ?? ""] ?? SPECIALTY_TAILWIND.default;
}

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

    const initMap = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapInstance.current) mapInstance.current.remove();

      const map = L.map(mapRef.current!).setView([23.8103, 90.4125], 7);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      filtered.forEach(c => {
        if (!c.lat || !c.lng) return;
        const color = SPECIALTY_COLORS[c.specialty ?? ""] ?? SPECIALTY_COLORS.default;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);${!c.verified ? "opacity:0.5" : ""}"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const popup = L.popup({ maxWidth: 260 }).setContent(`
          <div style="font-family:system-ui;padding:0.25rem 0.1rem">
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.3rem">${c.name}</div>
            ${c.verified ? '<span style="font-size:0.7rem;padding:0.15rem 0.45rem;background:#C2410C;color:white;border-radius:99px;font-weight:700">✓ Verified</span>' : '<span style="font-size:0.7rem;color:#aaa">Unverified</span>'}
            ${c.specialty ? `<div style="font-size:0.82rem;color:#666;margin-top:0.45rem;font-weight:600">${c.specialty}</div>` : ""}
            ${c.address ? `<div style="font-size:0.78rem;color:#888;margin-top:0.25rem">📍 ${c.address}</div>` : ""}
            ${c.phone ? `<div style="font-size:0.78rem;margin-top:0.2rem">📞 <a href="tel:${c.phone}" style="color:#C2410C;font-weight:600">${c.phone}</a></div>` : ""}
            ${c.email ? `<div style="font-size:0.78rem;margin-top:0.1rem">✉️ <a href="mailto:${c.email}" style="color:#C2410C">${c.email}</a></div>` : ""}
          </div>
        `);

        L.marker([c.lat, c.lng], { icon }).bindPopup(popup).addTo(map);
      });
    };

    initMap().catch(console.error);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [filtered.length, filter, verifiedOnly]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filter & Legend Bar ──────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <SlidersHorizontal size={16} className="text-stone-400 shrink-0" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[180px]"
          >
            {specialties.map(s => (
              <option key={s} value={s}>
                {s === "all" ? (isBn ? "সব বিশেষজ্ঞ" : "All Specialties") : s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-600"
            />
            {isBn ? "শুধু যাচাইকৃত" : "Verified only"}
          </label>
        </div>
        <div className="text-xs font-bold text-stone-400 shrink-0">
          {filtered.length} {isBn ? "চিকিৎসক" : "clinicians found"}
        </div>
      </div>

      {/* ── Color Legend ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(SPECIALTY_COLORS).filter(([k]) => k !== "default").map(([specialty, color]) => (
          <div key={specialty} className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
            <div style={{ background: color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
            {specialty}
          </div>
        ))}
      </div>

      {/* ── Map — isolated z-index so it never overlaps the navbar ─────── */}
      <div className="relative z-0 rounded-2xl overflow-hidden border border-stone-200 shadow-md">
        <div ref={mapRef} style={{ height: 480 }} />
      </div>

      {/* ── Clinician Cards Grid ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400 font-semibold text-sm">
          {isBn ? "কোনো চিকিৎসক পাওয়া যায়নি" : "No clinicians found for this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const sp = getStyle(c.specialty);
            const borderColor = SPECIALTY_COLORS[c.specialty ?? ""] ?? SPECIALTY_COLORS.default;
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5 flex flex-col gap-3"
                style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
              >
                {/* Name + verified */}
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-stone-900 text-base leading-snug">{c.name}</div>
                  {c.verified && (
                    <span className="inline-flex items-center gap-1 shrink-0 text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                      <BadgeCheck size={11} /> Verified
                    </span>
                  )}
                </div>

                {/* Specialty badge */}
                {c.specialty && (
                  <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full ${sp.bg} ${sp.text}`}>
                    {c.specialty}
                  </span>
                )}

                {/* Contact details */}
                <div className="flex flex-col gap-1.5 mt-auto">
                  {c.address && (
                    <div className="flex items-start gap-2 text-xs text-stone-500 font-medium">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-stone-400" />
                      <span className="leading-snug">{c.address}</span>
                    </div>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-2 text-xs font-semibold text-orange-700 hover:text-orange-600 transition-colors"
                    >
                      <Phone size={13} className="shrink-0" />
                      {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-2 text-xs font-semibold text-orange-700 hover:text-orange-600 transition-colors truncate"
                    >
                      <Mail size={13} className="shrink-0" />
                      {c.email}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
