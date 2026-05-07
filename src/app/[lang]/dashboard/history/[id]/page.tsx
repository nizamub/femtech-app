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

const RISK_CONFIG = {
  low:      { color: "#10B981", bg: "rgba(16,185,129,0.12)", label: "Low Risk",      emoji: "🟢" },
  moderate: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Moderate Risk", emoji: "🟡" },
  high:     { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "High Risk",     emoji: "🟠" },
  critical: { color: "#DC2626", bg: "rgba(220,38,38,0.12)", label: "Critical",       emoji: "🔴" },
};

export default async function AssessmentHistoryDetail({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);

  const userId = (session.user as any).id as string;
  const [assessment] = await db.select().from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.userId, userId))).limit(1);
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

  return (
    <div className="container animate-fade" style={{ maxWidth: 740, padding: "2rem 1rem" }}>
      <Link href={`/${lang}/dashboard`} style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "1.5rem" }}>
        ← {isBn ? "ড্যাশবোর্ডে ফিরুন" : "Back to Dashboard"}
      </Link>

      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
        {isBn ? "মূল্যায়নের বিবরণ" : "Assessment Details"}
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {assessment.completedAt
          ? new Date(assessment.completedAt).toLocaleDateString(isBn ? "bn-BD" : "en-GB", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : (isBn ? "সম্পন্ন হয়নি" : "Not completed")}
      </p>

      {/* Score */}
      <div className="card mb-3" style={{ textAlign: "center", background: risk.bg, border: `1px solid ${risk.color}40` }}>
        <div style={{ fontSize: "3.5rem", fontWeight: 900, color: risk.color }}>{Math.round(assessment.overallScore ?? 0)}</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{isBn ? "সামগ্রিক স্কোর / ১০০" : "Overall Score / 100"}</div>
        <span style={{ fontWeight: 700, color: risk.color }}>{risk.emoji} {risk.label}</span>
      </div>

      {/* Topic scores */}
      {scores.length > 0 && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: "1rem" }}>{isBn ? "বিষয়ভিত্তিক স্কোর" : "Topic Scores"}</h3>
          {scores.map(({ ts, t }) => {
            if (!t) return null;
            const pct = Math.round(ts.score);
            const c = pct >= 70 ? "#DC2626" : pct >= 40 ? "#F97316" : "#10B981";
            return (
              <div key={ts.id} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.icon} {isBn && t.labelBn ? t.labelBn : t.label}</span>
                  <span style={{ fontWeight: 700, color: c }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conditions */}
      {conds.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>{isBn ? "চিহ্নিত অবস্থা" : "Conditions Identified"}</h3>
          {conds.map(({ ac, c }) => {
            if (!c) return null;
            const cr = RISK_CONFIG[c.severity as keyof typeof RISK_CONFIG];
            return (
              <div key={ac.id} className="card mb-2" style={{ borderLeft: `4px solid ${cr.color}` }}>
                <div style={{ fontWeight: 700, color: cr.color }}>{isBn && c.nameBn ? c.nameBn : c.nameEn}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{ac.probabilityLabel} · {c.urgencyLabel}</div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{c.descriptionEn}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Answers */}
      {answers.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>{isBn ? "আপনার উত্তরসমূহ" : "Your Answers"}</h3>
          {answers.map(({ a, q, o }) => q && (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", gap: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", flex: 2 }}>{q.text}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{o?.label ?? a.freeTextValue ?? String(a.numericValue ?? "—")}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
        <Link href={`/${lang}/assessment`} className="btn btn-primary">🔄 {isBn ? "নতুন মূল্যায়ন" : "New Assessment"}</Link>
        <Link href={`/${lang}/assessment/${id}/result`} className="btn btn-secondary">📋 {isBn ? "পূর্ণ রিপোর্ট" : "Full Report"}</Link>
      </div>
    </div>
  );
}
