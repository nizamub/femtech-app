import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, type Locale } from "@/dictionaries";
import { db } from "@/db";
import { topics, questions, answerOptions, conditions } from "@/db/schema";
import { asc } from "drizzle-orm";
import QuestionsClient from "./QuestionsClient";
import { HelpCircle } from "lucide-react";

export default async function QuestionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "expert" && role !== "admin")) redirect(`/${lang}/auth/login`);

  const allTopics = await db.select().from(topics).orderBy(asc(topics.orderIndex));
  const allQuestions = await db.select().from(questions).orderBy(asc(questions.orderIndex));
  const allOptions = await db.select().from(answerOptions).orderBy(asc(answerOptions.orderIndex));
  const allConditions = await db.select().from(conditions);

  const topicsWithQuestions = allTopics.map(t => ({
    ...t,
    questions: allQuestions
      .filter(q => q.topicId === t.id)
      .map(q => ({ ...q, options: allOptions.filter(o => o.questionId === q.id) })),
  }));

  return (
    <div className="animate-up max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <HelpCircle className="text-emerald-800" size={28} /> Question & Logic Manager
        </h2>
        <p className="text-sm text-slate-500 font-medium">Create, edit, and configure branching logic for all assessment questions.</p>
      </div>
      <QuestionsClient
        initialTopics={topicsWithQuestions}
        allConditions={allConditions}
        lang={lang as Locale}
      />
    </div>
  );
}
