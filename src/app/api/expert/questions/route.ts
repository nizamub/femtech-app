// GET /api/expert/questions — list all questions with options
// POST /api/expert/questions — create question
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { questions, answerOptions, topics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "expert" && role !== "admin")) return null;
  return session;
}

export async function GET() {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const allTopics = await db.select().from(topics).orderBy(asc(topics.orderIndex));
  const allQuestions = await db.select().from(questions).orderBy(asc(questions.orderIndex));
  const allOptions = await db.select().from(answerOptions).orderBy(asc(answerOptions.orderIndex));

  // Merge
  const topicsWithQuestions = allTopics.map(t => ({
    ...t,
    questions: allQuestions
      .filter(q => q.topicId === t.id)
      .map(q => ({ ...q, options: allOptions.filter(o => o.questionId === q.id) })),
  }));

  return NextResponse.json(topicsWithQuestions);
}

const createSchema = z.object({
  topicId:    z.string().uuid(),
  text:       z.string().min(3),
  textBn:     z.string().optional(),
  type:       z.enum(["single", "multi", "scale", "date", "text", "colorpicker"]).default("single"),
  required:   z.boolean().default(true),
  orderIndex: z.number().int().default(0),
  minAge:       z.number().int().min(0).max(120).default(0),
  maxAge:       z.number().int().min(0).max(120).default(120),
  targetGender: z.enum(["female", "male", "other", "prefer_not_to_say"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = createSchema.parse(await req.json());
    const [q] = await db.insert(questions).values({ ...data, active: true }).returning();
    return NextResponse.json(q, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR", issues: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
