// PATCH /api/assessment/[id]/answer — submit an answer, get next question
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { assessments, assessmentAnswers, questions, answerOptions, topics, users } from "@/db/schema";
import { eq, and, asc, gt, lte, gte, or, isNull } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  topicId:       z.string().uuid(),
  questionId:    z.string().uuid(),
  optionId:      z.string().uuid().optional(),
  freeTextValue: z.string().optional(),
  numericValue:  z.number().optional(),
  severity:      z.number().int().min(0).max(10).default(0),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { id: assessmentId } = await params;
    const body = await req.json();
    const data = schema.parse(body);
    const userId = (session.user as any).id as string;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userAge = user?.age ?? null;
    const userGender = user?.gender ?? null;

    // Verify assessment belongs to user
    const [assessment] = await db.select().from(assessments)
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId))).limit(1);
    if (!assessment) return NextResponse.json({ error: "Assessment not found", code: "NOT_FOUND" }, { status: 404 });
    if (assessment.status === "completed") return NextResponse.json({ error: "Assessment already completed", code: "ALREADY_COMPLETED" }, { status: 400 });

    // Determine severity from option if provided
    let severity = data.severity;
    let nextQuestionId: string | null = null;

    if (data.optionId) {
      const [opt] = await db.select().from(answerOptions).where(eq(answerOptions.id, data.optionId)).limit(1);
      if (opt) {
        severity = opt.severity;
        nextQuestionId = opt.nextQuestionId ?? null;
        // If end_assessment is set, complete will be called separately
      }
    }

    // Save answer
    await db.insert(assessmentAnswers).values({
      assessmentId,
      topicId:       data.topicId,
      questionId:    data.questionId,
      optionId:      data.optionId ?? null,
      freeTextValue: data.freeTextValue ?? null,
      numericValue:  data.numericValue ?? null,
      severity,
    });

    // Determine next question
    let nextQuestion = null;
    let nextTopic = null;

    if (nextQuestionId) {
      // Branch override
      const [q] = await db.select().from(questions).where(eq(questions.id, nextQuestionId)).limit(1);
      if (q) {
        const opts = await db.select().from(answerOptions).where(eq(answerOptions.questionId, q.id)).orderBy(asc(answerOptions.orderIndex));
        nextQuestion = { ...q, options: opts };
      }
    } else {
      // Default: next question by orderIndex in same topic
      const [currentQ] = await db.select().from(questions).where(eq(questions.id, data.questionId)).limit(1);
      if (currentQ) {
        const questionConditions = [
          eq(questions.topicId, data.topicId),
          eq(questions.active, true),
          gt(questions.orderIndex, currentQ.orderIndex)
        ];
        
        if (userAge !== null) {
          questionConditions.push(lte(questions.minAge, userAge));
          questionConditions.push(gte(questions.maxAge, userAge));
        }
        
        if (userGender !== null) {
          questionConditions.push(or(isNull(questions.targetGender), eq(questions.targetGender, userGender)));
        }

        const [q] = await db.select().from(questions)
          .where(and(...(questionConditions as any)))
          .orderBy(asc(questions.orderIndex))
          .limit(1);
        if (q) {
          const opts = await db.select().from(answerOptions).where(eq(answerOptions.questionId, q.id)).orderBy(asc(answerOptions.orderIndex));
          nextQuestion = { ...q, options: opts };
        } else {
          // No more questions in current topic. Transition to NEXT topic with questions.
          const topicIds = assessment.topicIds as string[];
          let currentIndex = topicIds.indexOf(data.topicId);
          
          while (currentIndex !== -1 && currentIndex + 1 < topicIds.length) {
            const nextTopicId = topicIds[currentIndex + 1];
            
            const nextTopicQuestionConditions = [
              eq(questions.topicId, nextTopicId),
              eq(questions.active, true)
            ];
            
            if (userAge !== null) {
              nextTopicQuestionConditions.push(lte(questions.minAge, userAge));
              nextTopicQuestionConditions.push(gte(questions.maxAge, userAge));
            }
            
            if (userGender !== null) {
              nextTopicQuestionConditions.push(or(isNull(questions.targetGender), eq(questions.targetGender, userGender)));
            }
            
            // Get first question of next topic
            const [firstQ] = await db.select().from(questions)
              .where(and(...(nextTopicQuestionConditions as any)))
              .orderBy(asc(questions.orderIndex))
              .limit(1);

            if (firstQ) {
              // Found a topic with questions
              const [t] = await db.select().from(topics).where(eq(topics.id, nextTopicId)).limit(1);
              if (t) nextTopic = t;

              const opts = await db.select().from(answerOptions).where(eq(answerOptions.questionId, firstQ.id)).orderBy(asc(answerOptions.orderIndex));
              nextQuestion = { ...firstQ, options: opts };
              break; // Stop looking, we found the next question
            }
            
            // If this topic had no questions, loop to the next one
            currentIndex++;
          }
        }
      }
    }

    return NextResponse.json({ nextQuestion, nextTopic, done: nextQuestion === null });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    console.error("[assessment/answer]", e);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
