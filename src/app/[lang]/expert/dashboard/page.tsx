import { db } from "@/db";
import { topics, questions } from "@/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Folder, Eye, HelpCircle, Clock } from "lucide-react";
import * as Icons from "lucide-react";
import { TOPICS as TOPIC_META } from "@/lib/constants";

export default async function ExpertDashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  // Fetch real data from Postgres
  const allTopics = await db.select().from(topics).orderBy(asc(topics.orderIndex));
  const allQuestions = await db.select().from(questions);

  const topicsWithStats = allTopics.map(t => ({
    ...t,
    questionCount: allQuestions.filter(q => q.topicId === t.id).length
  }));

  const totalQuestions = allQuestions.length;
  const visibleTopics = allTopics.filter(t => t.visible).length;

  return (
    <div className="animate-up max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Expert Dashboard</h2>
      <p className="text-sm text-slate-500 mb-8 font-medium">Manage diagnostic content, questions, and scoring settings.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Topics", value: allTopics.length, icon: Folder, colorClass: "text-emerald-800" },
          { label: "Visible to Users", value: visibleTopics, icon: Eye, colorClass: "text-teal-600" },
          { label: "Total Questions", value: totalQuestions, icon: HelpCircle, colorClass: "text-amber-500" },
          { label: "Last Updated", value: "Live", icon: Clock, colorClass: "text-sky-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center">
            <s.icon className={`mb-2 ${s.colorClass}`} size={28} />
            <div className={`text-2xl font-extrabold ${s.colorClass}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-slate-900 mb-4">Quick Access — Topics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {topicsWithStats.map(t => {
          const meta = TOPIC_META.find(m => m.id === t.id);
          const iconString  = meta?.icon  ?? t.icon;
          const color = meta?.color ?? t.color;
          
          // Attempt to render Lucide icon, fallback to string
          const IconComp = (Icons as any)[iconString] || Icons.Activity;
          const isLucide = !!(Icons as any)[iconString];

          return (
            <Link key={t.id} href={`/${lang}/expert/dashboard/topics/${t.id}`} 
              className={`bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${t.visible ? 'border-slate-200' : 'border-slate-200 opacity-50 bg-slate-50'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-emerald-800" style={{ color: color }}>
                  {isLucide ? <IconComp size={24} /> : <span className="text-2xl">{iconString}</span>}
                </span>
                <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${t.visible ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {t.visible ? "Visible" : "Hidden"}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{t.label}</div>
              <div className="text-xs text-slate-500 font-medium">{t.questionCount} questions</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
