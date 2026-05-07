import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { assessments, assessmentAnswers, topicScores, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendHealthReport } from "@/lib/sendReport";

const AnswerSchema = z.object({
  topicId:    z.string().uuid(),
  questionId: z.string().uuid(),
  optionId:   z.string().uuid(),
  severity:   z.number().int().min(0).max(10),
});

const SubmitSchema = z.object({
  language: z.enum(["en", "bn"]).default("en"),
  answers:  z.array(AnswerSchema),
  topicScores: z.array(z.object({
    topicId:  z.string().uuid(),
    score:    z.number(),
    rawScore: z.number(),
    maxScore: z.number(),
  })),
  overallScore: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "moderate", "high", "critical"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  try {
    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const { language, answers, topicScores: tScores, overallScore, riskLevel } = parsed.data;
    const now = new Date();

    // Create assessment record
    const [assessment] = await db.insert(assessments).values({
      userId,
      startedAt:   now,
      completedAt: now,
      overallScore,
      riskLevel,
      language,
    }).returning({ id: assessments.id });

    // Insert all answers
    if (answers.length > 0) {
      await db.insert(assessmentAnswers).values(
        answers.map(a => ({
          assessmentId: assessment.id,
          topicId:      a.topicId,
          questionId:   a.questionId,
          optionId:     a.optionId,
          severity:     a.severity,
        }))
      );
    }

    // Insert topic scores
    if (tScores.length > 0) {
      await db.insert(topicScores).values(
        tScores.map(s => ({
          assessmentId: assessment.id,
          topicId:      s.topicId,
          score:        s.score,
          rawScore:     s.rawScore,
          maxScore:     s.maxScore,
        }))
      );
    }

    // Send email report in background (don't await — don't block response)
    sendHealthReport(assessment.id).catch(console.error);

    return NextResponse.json({ assessmentId: assessment.id, success: true });

  } catch (err) {
    console.error("Assessment submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
