// PATCH /api/expert/questions/[id] — update question
// DELETE /api/expert/questions/[id] — soft-delete
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { questions, answerOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

const updateSchema = z.object({
  text:       z.string().min(3).optional(),
  textBn:     z.string().optional(),
  type:       z.enum(["single", "multi", "scale", "date", "text", "colorpicker"]).optional(),
  required:   z.boolean().optional(),
  active:     z.boolean().optional(),
  orderIndex: z.number().int().optional(),
  minAge:       z.number().int().min(0).max(120).optional(),
  maxAge:       z.number().int().min(0).max(120).optional(),
  targetGender: z.enum(["female", "male", "other", "prefer_not_to_say"]).nullable().optional(),
  options: z.array(z.object({
    id:                 z.string().uuid().optional(),
    label:              z.string(),
    labelBn:            z.string().optional(),
    value:              z.string(),
    severity:           z.number().int().min(0).max(10).default(0),
    severityTag:        z.enum(["none","low","moderate","high","critical"]).default("none"),
    orderIndex:         z.number().int().default(0),
    nextQuestionId:     z.string().uuid().nullable().optional(),
    triggerConditionId: z.string().uuid().nullable().optional(),
    endAssessment:      z.boolean().default(false),
  })).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const body = updateSchema.parse(await req.json());
    const { options, ...questionFields } = body;

    if (Object.keys(questionFields).length > 0) {
      await db.update(questions).set(questionFields).where(eq(questions.id, id));
    }

    // Replace options if provided
    if (options !== undefined) {
      await db.delete(answerOptions).where(eq(answerOptions.questionId, id));
      if (options.length > 0) {
        await db.insert(answerOptions).values(
          options.map((o, i) => ({
            questionId:         id,
            label:              o.label,
            labelBn:            o.labelBn ?? null,
            value:              o.value,
            severity:           o.severity,
            severityTag:        o.severityTag,
            orderIndex:         o.orderIndex ?? i,
            nextQuestionId:     o.nextQuestionId ?? null,
            triggerConditionId: o.triggerConditionId ?? null,
            endAssessment:      o.endAssessment,
          }))
        );
      }
    }

    const [updated] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    const opts = await db.select().from(answerOptions).where(eq(answerOptions.questionId, id));
    return NextResponse.json({ ...updated, options: opts });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  await db.delete(questions).where(eq(questions.id, id));
  return NextResponse.json({ success: true });
}
