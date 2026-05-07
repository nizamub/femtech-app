import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, type Locale } from "@/dictionaries";
import Link from "next/link";
import { db } from "@/db";
import {
  assessments, assessmentConditions, assessmentAnswers,
  topicScores, conditions, topics, questions, answerOptions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, Activity, AlertTriangle, ClipboardList, RotateCcw, FileText } from "lucide-react";

const RISK_CONFIG = {
  low:      { color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  bar: "bg-green-500",  label: "Low Risk",      emoji: "🟢" },
  moderate: { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  bar: "bg-amber-500",  label: "Moderate Risk", emoji: "🟡" },
  high:     { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", bar: "bg-orange-500", label: "High Risk",      emoji: "🟠" },
  critical: { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    bar: "bg-red-500",    label: "Critical",       emoji: "🔴" },
};

export default async function AssessmentHistoryDetail({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);

  const userId = (session.user as any).id as string;
  const viewerRole = (session.user as any).role as string;
  const isExpertViewer = viewerRole === "expert" || viewerRole === "admin";

  const [assessment] = await db.select().from(assessments)
    .where(
      isExpertViewer
        ? eq(assessments.id, id)
        : and(eq(assessments.id, id), eq(assessments.userId, userId))
    ).limit(1);
  if (!assessment) notFound();

  const scores = await db.select({ ts: topicScores, t: topics })
    .from(topicScores).leftJoin(topics, eq(topicScores.topicId, topics.id))
    .where(eq(topicScores.assessmentId, id));

  const conds = await db.select({ ac: assessmentConditions, c: conditions })
    .from(assessmentConditions).leftJoin(conditions, eq(assessmentConditions.conditionId, conditions.id))
    .where(eq(assessmentConditions.assessmentId, id));

  const answers = await db.select({ a: assessmentAnswers, q: questions, o: answerOptions })
    .from(assessmentAnswers)
    .leftJoin(questions, eq(assessmentAnswers.questionId, questions.id))
    .leftJoin(answerOptions, eq(assessmentAnswers.optionId, answerOptions.id))
    .where(eq(assessmentAnswers.assessmentId, id));

  const isBn = lang === "bn";
  const riskLevel = (assessment.riskLevel ?? "low") as keyof typeof RISK_CONFIG;
  const risk = RISK_CONFIG[riskLevel];

  const dateStr = assessment.completedAt
    ? new Date(assessment.completedAt).toLocaleDateString(isBn ? "bn-BD" : "en-GB", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : (isBn ? "সম্পন্ন হয়নি" : "Not completed");

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-2xl mx-auto animate-up">

        {/* Back link */}
        <Link
          href={`/${lang}/dashboard`}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-700 font-semibold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          {isBn ? "ড্যাশবোর্ডে ফিরুন" : "Back to Dashboard"}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-stone-900 mb-1">
            {isBn ? "মূল্যায়নের বিবরণ" : "Assessment Details"}
          </h1>
          <p className="text-stone-500 text-sm">{dateStr}</p>
        </div>

        {/* Overall Score Card */}
        <div className={`rounded-2xl p-8 border shadow-sm text-center mb-6 ${risk.bg} ${risk.border}`}>
          <div className={`text-6xl font-black mb-1 ${risk.color}`}>
            {Math.round(assessment.overallScore ?? 0)}
          </div>
          <div className="text-stone-500 text-xs font-semibold uppercase tracking-widest mb-3">
            {isBn ? "সামগ্রিক স্কোর / ১০০" : "Overall Score / 100"}
          </div>
          <span className={`inline-flex items-center gap-2 font-bold text-base ${risk.color}`}>
            <Activity size={18} /> {risk.emoji} {risk.label}
          </span>
        </div>

        {/* Topic Scores */}
        {scores.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-5 flex items-center gap-2">
              <ClipboardList size={18} className="text-orange-600" />
              {isBn ? "বিষয়ভিত্তিক স্কোর" : "Topic Scores"}
            </h3>
            <div className="flex flex-col gap-4">
              {scores.map(({ ts, t }) => {
                if (!t) return null;
                const pct = Math.round(ts.score);
                const barColor = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-500" : "bg-green-500";
                const textColor = pct >= 70 ? "text-red-600" : pct >= 40 ? "text-amber-600" : "text-green-600";
                return (
                  <div key={ts.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-stone-700 text-sm">
                        {t.icon} {isBn && t.labelBn ? t.labelBn : t.label}
                      </span>
                      <span className={`font-bold text-sm ${textColor}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conditions Identified */}
        {conds.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-600" />
              {isBn ? "চিহ্নিত অবস্থা" : "Conditions Identified"}
            </h3>
            <div className="flex flex-col gap-3">
              {conds.map(({ ac, c }) => {
                if (!c) return null;
                const cr = RISK_CONFIG[c.severity as keyof typeof RISK_CONFIG];
                return (
                  <div key={ac.id} className={`bg-white border-l-4 ${cr.border} rounded-xl p-5 shadow-sm border border-stone-200`}>
                    <div className={`font-bold mb-1 ${cr.color}`}>
                      {isBn && c.nameBn ? c.nameBn : c.nameEn}
                    </div>
                    <div className="text-stone-500 text-xs mb-2 font-medium">
                      {ac.probabilityLabel} · {c.urgencyLabel}
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {isBn && c.descriptionBn ? c.descriptionBn : c.descriptionEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Answers */}
        {answers.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-orange-600" />
              {isBn ? "আপনার উত্তরসমূহ" : "Your Answers"}
            </h3>
            <div className="flex flex-col divide-y divide-stone-100">
              {answers.map(({ a, q, o }) => q && (
                <div key={a.id} className="flex justify-between items-start gap-4 py-3">
                  <span className="text-stone-600 text-sm flex-1 leading-relaxed">{isBn && q.textBn ? q.textBn : q.text}</span>
                  <span className="text-stone-900 text-sm font-semibold text-right shrink-0">
                    {o?.label ?? a.freeTextValue ?? String(a.numericValue ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${lang}/assessment`}
            className="inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
          >
            <RotateCcw size={17} />
            {isBn ? "নতুন মূল্যায়ন" : "New Assessment"}
          </Link>
          <Link
            href={`/${lang}/assessment/${id}/result`}
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
          >
            <FileText size={17} />
            {isBn ? "পূর্ণ রিপোর্ট" : "Full Report"}
          </Link>
        </div>
      </div>
    </div>
  );
}
