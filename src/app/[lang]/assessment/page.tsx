import { notFound, redirect } from "next/navigation";
import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { auth } from "@/auth";
import { db } from "@/db";
import { topics, questions, answerOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import AssessmentClient from "./AssessmentClient";

export default async function AssessmentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/auth/login`);

  // Load all visible topics with their questions and options
  const topicList = await db
    .select()
    .from(topics)
    .where(eq(topics.visible, true))
    .orderBy(asc(topics.orderIndex));

  const topicsWithQuestions = await Promise.all(
    topicList.map(async (topic) => {
      const questionList = await db
        .select()
        .from(questions)
        .where(eq(questions.topicId, topic.id))
        .orderBy(asc(questions.orderIndex));

      const questionsWithOptions = await Promise.all(
        questionList.map(async (question) => {
          const options = await db
            .select()
            .from(answerOptions)
            .where(eq(answerOptions.questionId, question.id))
            .orderBy(asc(answerOptions.orderIndex));
          return { ...question, options };
        })
      );

      return { ...topic, questions: questionsWithOptions };
    })
  );

  return (
    <AssessmentClient
      dict={dict}
      lang={lang as Locale}
      topics={topicsWithQuestions}
      userId={(session.user as any).id}
    />
  );
}
