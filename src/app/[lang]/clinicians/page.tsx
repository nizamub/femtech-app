import { db } from "@/db";
import { clinicians } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import CliniciansMapClient from "./CliniciansClient";

export default async function CliniciansPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const allClinicians = await db.select().from(clinicians);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          🗺️ {lang === "bn" ? "বিশেষজ্ঞ চিকিৎসক মানচিত্র" : "Find a Specialist"}
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          {lang === "bn" ? "বাংলাদেশে অভিজ্ঞ চিকিৎসক খুঁজুন" : "Find verified clinicians near you in Bangladesh"}
        </p>
      </div>
      <CliniciansMapClient clinicians={allClinicians} lang={lang as Locale} />
    </div>
  );
}
