import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale } from "@/dictionaries";
import { db } from "@/db";
import { users, assessments, assessmentConditions, conditions, topicScores, topics, expertNotes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, BarChart2, Stethoscope, ClipboardList, FileText, Activity } from "lucide-react";
import * as Icons from "lucide-react";

const RISK_CONFIG: Record<string, { color: string; bg: string }> = { 
  low: { color: "text-emerald-600", bg: "bg-emerald-50" }, 
  moderate: { color: "text-amber-500", bg: "bg-amber-50" }, 
  high: { color: "text-orange-500", bg: "bg-orange-50" }, 
  critical: { color: "text-red-600", bg: "bg-red-50" } 
};

export default async function PatientProfilePage({ params }: { params: Promise<{ lang: string; userId: string }> }) {
  const { lang, userId } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  const role = (session?.user as any)?.role;
  const expertId = (session?.user as any)?.id as string;
  if (!session?.user || (role !== "expert" && role !== "admin")) redirect(`/${lang}/auth/login`);

  const [patient] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!patient || patient.role !== "user") notFound();

  // All completed assessments
  const patientAssessments = await db.select().from(assessments)
    .where(and(eq(assessments.userId, userId), eq(assessments.status, "completed")))
    .orderBy(desc(assessments.completedAt))
    .limit(10);

  // Latest assessment conditions
  const latestAssessmentId = patientAssessments[0]?.id;
  const latestConditions = latestAssessmentId ? await db.select({ ac: assessmentConditions, c: conditions })
    .from(assessmentConditions)
    .leftJoin(conditions, eq(assessmentConditions.conditionId, conditions.id))
    .where(eq(assessmentConditions.assessmentId, latestAssessmentId)) : [];

  // Topic scores from latest
  const latestScores = latestAssessmentId ? await db.select({ ts: topicScores, t: topics })
    .from(topicScores).leftJoin(topics, eq(topicScores.topicId, topics.id))
    .where(eq(topicScores.assessmentId, latestAssessmentId)) : [];

  // Expert notes for this patient
  const notes = await db.select().from(expertNotes)
    .where(eq(expertNotes.userId, userId))
    .orderBy(desc(expertNotes.createdAt));

  return (
    <div className="animate-up max-w-5xl mx-auto">
      <Link href={`/${lang}/expert/dashboard/users`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-emerald-800 transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Patient Monitoring
      </Link>

      {/* Patient Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6 flex items-center gap-6 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-bold shrink-0 shadow-sm border border-emerald-200">
          {patient.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 mb-1 truncate">{patient.name}</h2>
          <div className="text-slate-500 text-sm font-medium mb-3 truncate">{patient.email}</div>
          <div className="flex gap-2 flex-wrap">
            {patient.age && <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-full border border-purple-200">Age {patient.age}</span>}
            {patient.gender && <span className="text-xs px-2.5 py-1 bg-cyan-50 text-cyan-700 font-bold rounded-full border border-cyan-200 capitalize">{patient.gender.replace("_", " ")}</span>}
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full border border-slate-200">
              {patientAssessments.length} assessments
            </span>
          </div>
        </div>
        {patientAssessments[0] && (() => {
          const rLevel = patientAssessments[0].riskLevel ?? "low";
          const rConfig = RISK_CONFIG[rLevel] || RISK_CONFIG.low;
          return (
            <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[140px]">
              <div className={`text-4xl font-black ${rConfig.color} leading-none mb-1`}>
                {Math.round(patientAssessments[0].overallScore ?? 0)}
              </div>
              <div className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Latest Score</div>
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${rConfig.bg} ${rConfig.color} border-${rConfig.color.split('-')[1]}-200 capitalize`}>
                {rLevel} risk
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Latest topic scores */}
        {latestScores.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2"><BarChart2 className="text-emerald-800" size={20} /> Latest Topic Scores</h3>
            <div className="space-y-4">
              {latestScores.map(({ ts, t }) => {
                if (!t) return null;
                const pct = Math.round(ts.score);
                const scoreColorClass = pct >= 70 ? "text-red-600 bg-red-500" : pct >= 40 ? "text-orange-500 bg-orange-500" : "text-emerald-600 bg-emerald-500";
                const textColor = scoreColorClass.split(' ')[0];
                const bgColor = scoreColorClass.split(' ')[1];
                
                const IconComp = (Icons as any)[t.icon] || Icons.Activity;
                const isLucide = !!(Icons as any)[t.icon];

                return (
                  <div key={ts.id}>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-emerald-800 opacity-80">{isLucide ? <IconComp size={16} /> : <span>{t.icon}</span>}</span> {t.label}
                      </span>
                      <span className={`font-bold ${textColor}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${bgColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Latest conditions */}
        {latestConditions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2"><Stethoscope className="text-emerald-800" size={20} /> Conditions (Latest)</h3>
            <div className="space-y-3">
              {latestConditions.map(({ ac, c }) => {
                if (!c) return null;
                const rConfig = RISK_CONFIG[c.severity] || RISK_CONFIG.low;
                return (
                  <div key={ac.id} className={`p-4 rounded-xl border relative overflow-hidden bg-white ${rConfig.bg.replace('bg-', 'border-')}`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${rConfig.color.replace('text-', 'bg-')}`} />
                    <div className={`font-bold text-sm mb-1 ${rConfig.color}`}>{c.nameEn}</div>
                    <div className="text-xs text-slate-500 font-medium">{ac.probabilityLabel} · {c.urgencyLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Assessment history */}
      {patientAssessments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 overflow-hidden">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ClipboardList className="text-emerald-800" size={20} /> Assessment History</h3>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Date", "Score", "Risk", "View"].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patientAssessments.map(a => {
                  const rConfig = RISK_CONFIG[a.riskLevel ?? "low"] || RISK_CONFIG.low;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-slate-900">{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}</td>
                      <td className={`py-4 px-4 text-sm font-bold ${rConfig.color}`}>{Math.round(a.overallScore ?? 0)}%</td>
                      <td className="py-4 px-4">
                        <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border inline-block capitalize ${rConfig.bg} ${rConfig.color} border-${rConfig.color.split('-')[1]}-200`}>
                          {a.riskLevel ?? "low"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Link href={`/${lang}/assessment/${a.id}/result`} className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors inline-block" target="_blank">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expert notes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="text-emerald-800" size={20} /> Clinical Notes</h3>
        <form action={async (fd: FormData) => {
          "use server";
          const { db: dbServer } = await import("@/db");
          const { expertNotes: en } = await import("@/db/schema");
          const note = fd.get("note") as string;
          if (note?.trim()) {
            await dbServer.insert(en).values({ expertId, userId, note: note.trim() });
          }
        }} className="mb-6">
          <textarea name="note" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm resize-y min-h-[100px] mb-3" placeholder="Add a clinical note for this patient..." />
          <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-5 rounded-xl transition-colors shadow-sm text-sm">Add Note</button>
        </form>

        {notes.length > 0 && (
          <div className="space-y-3">
            {notes.map(n => (
              <div key={n.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.note}</div>
                <div className="text-[0.7rem] font-medium text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
