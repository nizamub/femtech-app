// POST /api/assessment/start
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { assessments, topics, questions, answerOptions, users } from "@/db/schema";
import { eq, asc, and, lte, gte, or, isNull } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  topicId: z.string().uuid().optional(),
  lang: z.string().default("en"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json();
    const { topicId, lang } = schema.parse(body);
    const userId = (session.user as any).id as string;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userAge = user?.age ?? null;
    const userGender = user?.gender ?? null;

    let targetTopics = [];

    if (topicId) {
      const [topic] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
      if (!topic) return NextResponse.json({ error: "Topic not found", code: "NOT_FOUND" }, { status: 404 });
      targetTopics.push(topic);
    } else {
      targetTopics = await db.select().from(topics).where(eq(topics.visible, true)).orderBy(asc(topics.orderIndex));
      if (targetTopics.length === 0) return NextResponse.json({ error: "No topics available", code: "NO_TOPICS" }, { status: 404 });
    }

    const topicIds = targetTopics.map(t => t.id);

    // Create assessment session
    const [assessment] = await db.insert(assessments).values({
      userId,
      topicIds,
      status: "in_progress",
      language: lang,
    }).returning();

    // Load first question of the first topic
    const firstTopicId = topicIds[0];
    
    const questionConditions = [
      eq(questions.topicId, firstTopicId),
      eq(questions.active, true)
    ];

    if (userAge !== null) {
      questionConditions.push(lte(questions.minAge, userAge));
      questionConditions.push(gte(questions.maxAge, userAge));
    }

    if (userGender !== null) {
      questionConditions.push(or(isNull(questions.targetGender), eq(questions.targetGender, userGender)));
    }

    const [firstQuestion] = await db
      .select()
      .from(questions)
      .where(and(...(questionConditions as any)))
      .orderBy(asc(questions.orderIndex))
      .limit(1);

    let firstWithOptions = null;
    if (firstQuestion) {
      const opts = await db.select().from(answerOptions).where(eq(answerOptions.questionId, firstQuestion.id)).orderBy(asc(answerOptions.orderIndex));
      firstWithOptions = { ...firstQuestion, options: opts };
    }

    return NextResponse.json({ assessmentId: assessment.id, question: firstWithOptions, topic: targetTopics[0] });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    console.error("[assessment/start]", e);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
