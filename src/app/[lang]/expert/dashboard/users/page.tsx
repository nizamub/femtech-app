import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, type Locale } from "@/dictionaries";
import { db } from "@/db";
import { users, assessments } from "@/db/schema";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";

const RISK_CONFIG: Record<string, { color: string; bg: string }> = { 
  low: { color: "text-emerald-600", bg: "bg-emerald-50" }, 
  moderate: { color: "text-amber-500", bg: "bg-amber-50" }, 
  high: { color: "text-orange-500", bg: "bg-orange-50" }, 
  critical: { color: "text-red-600", bg: "bg-red-50" } 
};

export default async function UsersPage({ params, searchParams }: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; search?: string; risk?: string }>;
}) {
  const { lang } = await params;
  const { page = "1", search = "", risk = "" } = await searchParams;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "expert" && role !== "admin")) redirect(`/${lang}/auth/login`);

  const pageNum = Math.max(1, parseInt(page));
  const limit = 25;
  const offset = (pageNum - 1) * limit;

  // Get all users with their latest assessment stats
  const allUsers = await db
    .select({
      id:              users.id,
      name:            users.name,
      email:           users.email,
      age:             users.age,
      gender:          users.gender,
      createdAt:       users.createdAt,
      totalAssessments: count(assessments.id),
      avgScore:        avg(assessments.overallScore),
      latestRisk:      sql<string>`MAX(CASE WHEN ${assessments.completedAt} IS NOT NULL THEN ${assessments.riskLevel} END)`,
      latestDate:      sql<Date>`MAX(${assessments.completedAt})`,
    })
    .from(users)
    .leftJoin(assessments, eq(assessments.userId, users.id))
    .where(sql`${users.role} = 'user'`)
    .groupBy(users.id)
    .orderBy(desc(sql`MAX(${assessments.completedAt})`))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(users).where(sql`role = 'user'`);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-up max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Users className="text-emerald-800" size={28} />
            Patient Monitoring
          </h2>
          <p className="text-sm text-slate-500 font-medium">{total} registered patients</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                {["Patient", "Age / Gender", "Assessments", "Avg Score", "Latest Risk", "Last Active", ""].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allUsers.map(u => {
                const riskLevel = (u.latestRisk ?? "low") as string;
                const rConfig = RISK_CONFIG[riskLevel] || RISK_CONFIG.low;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-sm text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-600">
                      {u.age ?? "—"} {u.gender ? `/ ${u.gender.replace("_", " ")}` : ""}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700 text-center">{u.totalAssessments}</td>
                    <td className={`py-4 px-4 font-bold ${rConfig.color} text-center`}>
                      {u.avgScore ? `${Math.round(Number(u.avgScore))}%` : "—"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {riskLevel !== "low" || u.totalAssessments > 0 ? (
                        <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border inline-block capitalize ${rConfig.bg} ${rConfig.color} border-${rConfig.color.split('-')[1]}-200`}>
                          {riskLevel}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-500">
                      {u.latestDate ? new Date(u.latestDate).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link href={`/${lang}/expert/dashboard/users/${u.id}`} className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold py-1.5 px-3 rounded-lg transition-colors text-sm border border-emerald-200">
                        View <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 justify-center mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/${lang}/expert/dashboard/users?page=${p}`}
                className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm transition-colors border ${p === pageNum ? "bg-emerald-800 border-emerald-800 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`}>
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
