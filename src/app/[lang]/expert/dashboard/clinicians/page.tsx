import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, type Locale } from "@/dictionaries";
import { db } from "@/db";
import { clinicians } from "@/db/schema";
import { asc } from "drizzle-orm";
import CliniciansClient from "./CliniciansClient";
import { Hospital } from "lucide-react";

export default async function ExpertCliniciansPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "expert" && role !== "admin")) redirect(`/${lang}/auth/login`);

  const allClinicians = await db.select().from(clinicians).orderBy(asc(clinicians.name));

  return (
    <div className="animate-up max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Hospital className="text-orange-700" size={28} />
          Clinician Directory
        </h2>
        <p className="text-sm text-stone-500 font-medium">Manage the directory of recommended specialists and hospitals.</p>
      </div>
      <CliniciansClient initialClinicians={allClinicians} lang={lang as Locale} />
    </div>
  );
}
