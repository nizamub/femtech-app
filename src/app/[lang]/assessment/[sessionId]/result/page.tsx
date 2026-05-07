import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, type Locale } from "@/dictionaries";
import { db } from "@/db";
import {
  assessments, assessmentConditions, assessmentAnswers,
  topicScores, conditions, topics, questions, answerOptions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { ClipboardCheck, MapPin, RefreshCcw, Activity, Info, Stethoscope, AlertTriangle } from "lucide-react";

const RISK_CONFIG = {
  low:      { color: "#10B981", bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-200", label: "Low Risk",      icon: Activity },
  moderate: { color: "#F59E0B", bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-200", label: "Moderate Risk", icon: Info },
  high:     { color: "#F97316", bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-200", label: "High Risk",     icon: AlertTriangle },
  critical: { color: "#DC2626", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Critical",      icon: AlertTriangle },
};

export default async function ResultPage({ params }: { params: Promise<{ lang: string; sessionId: string }> }) {
  const { lang, sessionId } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);

  const userId = (session.user as any).id as string;
  const viewerRole = (session.user as any).role as string;
  const isExpertViewer = viewerRole === "expert" || viewerRole === "admin";

  // Experts/admins can view any assessment; patients can only see their own
  const [assessment] = await db.select().from(assessments)
    .where(
      isExpertViewer
        ? eq(assessments.id, sessionId)
        : and(eq(assessments.id, sessionId), eq(assessments.userId, userId))
    ).limit(1);
  if (!assessment || assessment.status !== "completed") notFound();

  // Topic scores with topic info
  const scores = await db.select({ ts: topicScores, t: topics })
    .from(topicScores).leftJoin(topics, eq(topicScores.topicId, topics.id))
    .where(eq(topicScores.assessmentId, sessionId));

  // Triggered conditions
  const triggeredConditions = await db.select({ ac: assessmentConditions, c: conditions })
    .from(assessmentConditions).leftJoin(conditions, eq(assessmentConditions.conditionId, conditions.id))
    .where(eq(assessmentConditions.assessmentId, sessionId));

  // Matched answers (for symptoms list)
  const answers = await db.select({ a: assessmentAnswers, q: questions, o: answerOptions })
    .from(assessmentAnswers)
    .leftJoin(questions, eq(assessmentAnswers.questionId, questions.id))
    .leftJoin(answerOptions, eq(assessmentAnswers.optionId, answerOptions.id))
    .where(eq(assessmentAnswers.assessmentId, sessionId));

  const riskLevel = (assessment.riskLevel ?? "low") as keyof typeof RISK_CONFIG;
  const risk = RISK_CONFIG[riskLevel];
  const isBn = lang === "bn";
  const overallScore = Math.round(assessment.overallScore ?? 0);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 animate-up">
      {/* Header */}
      <div className="text-center mb-10">
        <ClipboardCheck size={48} className="text-orange-700 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          {isBn ? "আপনার স্বাস্থ্য রিপোর্ট" : "Your Health Report"}
        </h1>
        <p className="text-stone-500 font-medium">
          {new Date(assessment.completedAt!).toLocaleDateString(isBn ? "bn-BD" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Overall Score Ring */}
      <div className={`rounded-3xl border text-center p-8 mb-8 shadow-sm ${risk.bg} ${risk.border}`}>
        <div className={`text-6xl font-black leading-none mb-2 ${risk.text}`}>{overallScore}</div>
        <div className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-4">{isBn ? "সামগ্রিক স্কোর" : "Overall Score"} / 100</div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white font-bold border shadow-sm ${risk.text} ${risk.border}`}>
          <risk.icon size={18} /> {risk.label}
        </div>
      </div>

      {/* Per-Topic Scores */}
      {scores.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="font-bold text-slate-900 mb-6">{isBn ? "বিষয়ভিত্তিক ফলাফল" : "Per-Topic Scores"}</h3>
          {scores.map(({ ts, t }) => {
            if (!t) return null;
            const pct = Math.round(ts.score);
            const scoreColorClass = pct >= 70 ? "bg-red-500 text-red-700" : pct >= 40 ? "bg-orange-500 text-orange-700" : "bg-orange-500 text-orange-600";
            const barColorClass = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-orange-500" : "bg-orange-500";
            return (
              <div key={ts.id} className="mb-5 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                    {/* Fallback to simple span since icon strings from DB are not components in this file without dynamic mapping */}
                    <span className="opacity-80">{t.icon}</span> {isBn && t.labelBn ? t.labelBn : t.label}
                  </span>
                  <span className={`font-bold text-sm ${scoreColorClass.split(' ')[1]}`}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColorClass}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Condition Cards */}
      {triggeredConditions.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-slate-900 mb-4">{isBn ? "চিহ্নিত অবস্থা" : "Conditions Identified"}</h3>
          {triggeredConditions.map(({ ac, c }) => {
            if (!c) return null;
            const cr = RISK_CONFIG[c.severity as keyof typeof RISK_CONFIG];
            return (
              <div key={ac.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full`} style={{ backgroundColor: cr.color }} />
                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                  <div>
                    <h4 className={`font-bold text-lg leading-tight mb-1 ${cr.text}`}>{isBn && c.nameBn ? c.nameBn : c.nameEn}</h4>
                    <div className="text-sm text-stone-500 font-medium">{isBn && c.laypersonNameBn ? c.laypersonNameBn : c.laypersonNameEn}</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cr.bg} ${cr.text} ${cr.border}`}>
                      <cr.icon size={12} /> {cr.label}
                    </span>
                    <div className="text-xs text-stone-500 mt-1.5 font-medium">{c.urgencyLabel}</div>
                  </div>
                </div>
                <p className="text-sm text-stone-600 mb-4 leading-relaxed">{c.descriptionEn}</p>
                {c.nextStepsEn && (
                  <div className="text-sm p-4 bg-stone-50 border border-slate-100 rounded-xl whitespace-pre-line text-slate-700 leading-relaxed mb-4">
                    <strong className="text-slate-900 block mb-1">{isBn ? "পরবর্তী পদক্ষেপ:" : "Next Steps:"}</strong>
                    {c.nextStepsEn}
                  </div>
                )}
                {c.specialistType && (
                  <div className="text-sm text-stone-600 mb-3 flex items-center gap-1.5">
                    <Stethoscope size={16} className="text-orange-600" />
                    {isBn ? "বিশেষজ্ঞ:" : "Specialist:"} <strong className="text-orange-900">{c.specialistType}</strong>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-stone-400 italic flex-1">{c.disclaimer}</div>
                  <div className="text-xs font-bold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg border border-emerald-100">
                    {ac.probabilityLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Matched Symptoms */}
      {answers.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="font-bold text-slate-900 mb-4">{isBn ? "আপনার উত্তরের সারসংক্ষেপ" : "Based on Your Answers"}</h3>
          <div className="flex flex-col gap-1">
            {answers.map(({ a, q, o }) => q && (
              <div key={a.id} className="flex justify-between gap-4 py-3 border-b border-slate-100 last:border-0 items-center">
                <span className="text-stone-600 text-sm font-medium">{q.text}</span>
                <span className="text-sm font-bold text-slate-900 text-right bg-stone-50 px-2 py-1 rounded">{o?.label ?? a.freeTextValue ?? `${a.numericValue}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 mt-10">
        <Link href={`/${lang}/clinicians`} className="bg-orange-700 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm">
          <MapPin size={18} /> {isBn ? "বিশেষজ্ঞ খুঁজুন" : "Find a Specialist"}
        </Link>
        <Link href={`/${lang}/assessment`} className="bg-white border border-stone-200 hover:bg-stone-50 text-slate-700 font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm">
          <RefreshCcw size={18} /> {isBn ? "আবার মূল্যায়ন করুন" : "Start Another Assessment"}
        </Link>
        <Link href={`/${lang}/dashboard`} className="bg-white border border-stone-200 hover:bg-stone-50 text-slate-700 font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm">
          <Activity size={18} /> {isBn ? "ড্যাশবোর্ড" : "My Dashboard"}
        </Link>
      </div>
    </div>
  );
}
