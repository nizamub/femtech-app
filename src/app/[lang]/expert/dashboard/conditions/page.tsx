import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, type Locale } from "@/dictionaries";
import { db } from "@/db";
import { conditions } from "@/db/schema";
import { asc } from "drizzle-orm";
import ConditionsClient from "./ConditionsClient";
import { Stethoscope } from "lucide-react";

export default async function ConditionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "expert" && role !== "admin")) redirect(`/${lang}/auth/login`);

  const allConditions = await db.select().from(conditions).orderBy(asc(conditions.nameEn));

  return (
    <div className="animate-up max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Stethoscope className="text-orange-700" size={28} />
          Condition Builder
        </h2>
        <p className="text-sm text-stone-500 font-medium">Manage health conditions, severity levels, next steps, and scoring thresholds.</p>
      </div>
      <ConditionsClient initialConditions={allConditions} lang={lang as Locale} />
    </div>
  );
}
