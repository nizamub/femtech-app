// GET /api/assessment/[id] — fetch completed assessment with conditions
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  assessments, assessmentAnswers, assessmentConditions,
  topicScores, conditions, topics, questions, answerOptions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { id: assessmentId } = await params;
    const userId = (session.user as any).id as string;

    const [assessment] = await db.select().from(assessments)
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId))).limit(1);
    if (!assessment) return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });

    // Topic scores
    const scores = await db.select({ ts: topicScores, t: topics })
      .from(topicScores)
      .leftJoin(topics, eq(topicScores.topicId, topics.id))
      .where(eq(topicScores.assessmentId, assessmentId));

    // Triggered conditions
    const triggeredConditions = await db.select({ ac: assessmentConditions, c: conditions })
      .from(assessmentConditions)
      .leftJoin(conditions, eq(assessmentConditions.conditionId, conditions.id))
      .where(eq(assessmentConditions.assessmentId, assessmentId));

    // Answers with question text
    const answers = await db.select({ a: assessmentAnswers, q: questions, o: answerOptions })
      .from(assessmentAnswers)
      .leftJoin(questions, eq(assessmentAnswers.questionId, questions.id))
      .leftJoin(answerOptions, eq(assessmentAnswers.optionId, answerOptions.id))
      .where(eq(assessmentAnswers.assessmentId, assessmentId));

    return NextResponse.json({ assessment, scores, conditions: triggeredConditions, answers });
  } catch (e) {
    console.error("[assessment/get]", e);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
