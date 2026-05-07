import { notFound } from "next/navigation";
import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { assessments, topicScores, topics, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Stethoscope, Activity, Calendar, ClipboardList, Lightbulb } from "lucide-react";

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const d = dict.dashboard;

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);
  const userId = (session.user as any).id as string;

  // Fetch user assessments with topic scores
  const userAssessments = await db
    .select({
      id:           assessments.id,
      startedAt:    assessments.startedAt,
      completedAt:  assessments.completedAt,
      overallScore: assessments.overallScore,
      riskLevel:    assessments.riskLevel,
    })
    .from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(desc(assessments.completedAt))
    .limit(10);

  const latest = userAssessments[0];
  const riskColorClass = { low: "text-emerald-600", moderate: "text-amber-500", high: "text-orange-500", critical: "text-red-600" };
  const riskBgClass = { low: "bg-emerald-50 border-emerald-200", moderate: "bg-amber-50 border-amber-200", high: "bg-orange-50 border-orange-200", critical: "bg-red-50 border-red-200" };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{d.welcome}, {session.user.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm font-medium">{d.title}</p>
        </div>
        <Link href={`/${lang}/assessment`} className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm flex items-center gap-2">
          <Stethoscope size={18} /> {d.startAssessment}
        </Link>
      </div>

      {/* Score card */}
      {latest ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: d.overallScore, value: `${Math.round(latest.overallScore ?? 0)}%`, icon: Activity, colorClass: "text-emerald-800" },
            { label: d.riskLevel, value: dict.results.riskLevels[latest.riskLevel ?? "low"], icon: Stethoscope, colorClass: riskColorClass[latest.riskLevel ?? "low"] },
            { label: d.lastAssessment, value: latest.completedAt ? new Date(latest.completedAt).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US") : "—", icon: Calendar, colorClass: "text-teal-600" },
            { label: "Total Assessments", value: String(userAssessments.length), icon: ClipboardList, colorClass: "text-cyan-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center">
              <s.icon className={`mb-2 ${s.colorClass}`} size={28} />
              <div className={`text-2xl font-extrabold ${s.colorClass}`}>{s.value}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm mb-8 flex flex-col items-center">
          <Stethoscope className="text-emerald-800 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-900 mb-2">{d.noAssessments}</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md">{d.noAssessmentsSubtext}</p>
          <Link href={`/${lang}/assessment`} className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2">
            <Stethoscope size={18} /> {d.startAssessment}
          </Link>
        </div>
      )}

      {/* Assessment History */}
      {userAssessments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">{d.assessmentHistory}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[d.date, d.score, d.riskLevel, ""].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userAssessments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {a.completedAt ? new Date(a.completedAt).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "In progress"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {Math.round(a.overallScore ?? 0)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${riskBgClass[a.riskLevel ?? "low"]} ${riskColorClass[a.riskLevel ?? "low"]}`}>
                        {dict.results.riskLevels[a.riskLevel ?? "low"]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/${lang}/dashboard/history/${a.id}`} className="text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                        {d.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {latest?.riskLevel && (
        <div className={`rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-3 border ${riskBgClass[latest.riskLevel]}`}>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className={riskColorClass[latest.riskLevel]} size={24} />
            <h3 className={`text-lg font-bold ${riskColorClass[latest.riskLevel]} m-0`}>{d.recommendations}</h3>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed max-w-3xl">{dict.results.advice[latest.riskLevel]}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href={`/${lang}/clinicians`} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
              {dict.results.findClinician}
            </Link>
            {latest.id && (
              <Link href={`/${lang}/dashboard/history/${latest.id}`} className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
                {d.viewDetails}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
