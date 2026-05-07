import { notFound, redirect } from "next/navigation";
import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { auth } from "@/auth";
import { db } from "@/db";
import { assessments, users, topicScores, topics } from "@/db/schema";
import { count, avg, sql, desc } from "drizzle-orm";
import Link from "next/link";
import { BarChart2, Users, ClipboardList, AlertTriangle, Activity, Folder, Clock } from "lucide-react";
import * as Icons from "lucide-react";

const RISK_CONFIG: Record<string, { color: string; bg: string; textHex: string; hexBg: string }> = { 
  low: { color: "text-emerald-600", bg: "bg-emerald-50", textHex: "#10B981", hexBg: "#10B98120" }, 
  moderate: { color: "text-amber-500", bg: "bg-amber-50", textHex: "#F59E0B", hexBg: "#F59E0B20" }, 
  high: { color: "text-orange-500", bg: "bg-orange-50", textHex: "#F97316", hexBg: "#F9731620" }, 
  critical: { color: "text-red-600", bg: "bg-red-50", textHex: "#DC2626", hexBg: "#DC262620" } 
};

export default async function ExpertAnalyticsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const d = dict.expert;

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "expert" && role !== "admin")) redirect(`/${lang}/auth/login`);

  // Aggregate stats
  const [totalUsersRow] = await db.select({ count: count() }).from(users).where(sql`role = 'user'`);
  const [totalAssessmentsRow] = await db.select({ count: count() }).from(assessments).where(sql`completed_at IS NOT NULL`);
  const [avgScoreRow] = await db.select({ avg: avg(assessments.overallScore) }).from(assessments).where(sql`completed_at IS NOT NULL`);

  // Risk distribution
  const riskDist = await db
    .select({ riskLevel: assessments.riskLevel, count: count() })
    .from(assessments)
    .where(sql`completed_at IS NOT NULL`)
    .groupBy(assessments.riskLevel);

  // Per-topic avg scores
  const topicAvgs = await db
    .select({
      topicId:   topicScores.topicId,
      label:     topics.label,
      icon:      topics.icon,
      color:     topics.color,
      avgScore:  avg(topicScores.score),
    })
    .from(topicScores)
    .leftJoin(topics, sql`${topicScores.topicId} = ${topics.id}`)
    .groupBy(topicScores.topicId, topics.label, topics.icon, topics.color)
    .orderBy(sql`avg(${topicScores.score}) DESC`)
    .limit(12);

  // Recent assessments
  const recent = await db
    .select({
      id:          assessments.id,
      completedAt: assessments.completedAt,
      overallScore: assessments.overallScore,
      riskLevel:   assessments.riskLevel,
      userName:    users.name,
      userEmail:   users.email,
    })
    .from(assessments)
    .leftJoin(users, sql`${assessments.userId} = ${users.id}`)
    .where(sql`${assessments.completedAt} IS NOT NULL`)
    .orderBy(desc(assessments.completedAt))
    .limit(10);

  return (
    <div className="animate-up max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <BarChart2 className="text-emerald-800" size={28} />
          {d.analytics}
        </h2>
        <p className="text-sm text-slate-500 font-medium">Aggregate health data across all users and assessments.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: d.totalUsers, value: totalUsersRow?.count ?? 0, icon: Users, colorClass: "text-emerald-800" },
          { label: d.totalAssessments, value: totalAssessmentsRow?.count ?? 0, icon: ClipboardList, colorClass: "text-teal-600" },
          { label: d.avgScore, value: `${Math.round(Number(avgScoreRow?.avg ?? 0))}%`, icon: BarChart2, colorClass: "text-amber-500" },
          { label: d.riskDistribution, value: riskDist.find(r => r.riskLevel === "high")?.count ?? 0 + " High Risk", icon: AlertTriangle, colorClass: "text-orange-500" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center">
            <s.icon className={`mb-2 ${s.colorClass}`} size={28} />
            <div className={`text-2xl font-extrabold ${s.colorClass}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Activity className="text-emerald-800" size={20} /> {d.riskDistribution}
          </h3>
          <div className="flex flex-col gap-4 justify-center flex-1">
            {(["low", "moderate", "high", "critical"] as const).map(level => {
              const row = riskDist.find(r => r.riskLevel === level);
              const cnt = row?.count ?? 0;
              const total = totalAssessmentsRow?.count ?? 1;
              const pct = Math.round((cnt / total) * 100);
              const rConfig = RISK_CONFIG[level] || RISK_CONFIG.low;
              return (
                <div key={level} className="w-full">
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className={`font-bold capitalize ${rConfig.color}`}>{level}</span>
                    <span className="text-slate-500 font-semibold text-xs">{cnt} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: rConfig.textHex }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic avg scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Folder className="text-emerald-800" size={20} /> Per-Topic Average Scores
          </h3>
          <div className="flex flex-col gap-3.5">
            {topicAvgs.map(t => {
              const score = Math.round(Number(t.avgScore ?? 0));
              const scoreColorClass = score >= 60 ? "text-red-600 bg-red-500" : score >= 35 ? "text-orange-500 bg-orange-500" : "text-emerald-600 bg-emerald-500";
              const textColor = scoreColorClass.split(' ')[0];
              const bgColor = scoreColorClass.split(' ')[1];

              const IconComp = t.icon ? ((Icons as any)[t.icon] || Icons.Activity) : Icons.Activity;
              const isLucide = t.icon ? !!(Icons as any)[t.icon] : false;

              return (
                <div key={String(t.topicId)} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <span className="text-emerald-800 opacity-80">{isLucide ? <IconComp size={16} /> : <span>{t.icon}</span>}</span>
                    <span className="text-sm font-semibold text-slate-700 truncate" style={{ color: t.color || undefined }}>{t.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${bgColor}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <span className={`text-sm font-bold w-10 text-right shrink-0 ${textColor}`}>{score}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent assessments */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 m-0 flex items-center gap-2">
            <Clock className="text-emerald-800" size={20} /> Recent Assessments
          </h3>
          <Link href={`/${lang}/expert/dashboard/users`} className="text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-semibold py-1.5 px-4 rounded-xl transition-colors text-sm border border-emerald-200">
            View All Users →
          </Link>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100">
                {["User", "Date", "Score", "Risk"].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.map(a => {
                const rConfig = RISK_CONFIG[a.riskLevel ?? "low"] || RISK_CONFIG.low;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-slate-900">{a.userName}</div>
                      <div className="text-xs text-slate-500 font-medium">{a.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">
                      {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className={`py-3 px-4 text-sm font-bold ${rConfig.color}`}>
                      {Math.round(a.overallScore ?? 0)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border inline-block capitalize ${rConfig.bg} ${rConfig.color} border-${rConfig.color.split('-')[1]}-200`}>
                        {a.riskLevel ?? "low"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
