import { db } from "@/db";
import { clinicians } from "@/db/schema";
import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import CliniciansMapClient from "./CliniciansClient";
import { MapPin } from "lucide-react";

export default async function CliniciansPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const allClinicians = await db.select().from(clinicians);
  const isBn = lang === "bn";

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Page Header */}
        <div className="mb-8 animate-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold mb-4 uppercase tracking-wider">
            <MapPin size={14} />
            {isBn ? "স্বাস্থ্যসেবা পরিচালক" : "Health Specialists"}
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mb-2">
            {isBn ? "বিশেষজ্ঞ চিকিৎসক খুঁজুন" : "Find a Specialist"}
          </h1>
          <p className="text-stone-500 font-medium">
            {isBn ? "বাংলাদেশে অভিজ্ঞ ও যাচাইকৃত চিকিৎসক খুঁজুন" : "Find verified clinicians near you across Bangladesh"}
          </p>
        </div>

        <CliniciansMapClient clinicians={allClinicians} lang={lang as Locale} />
      </div>
    </div>
  );
}
