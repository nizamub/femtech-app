// PATCH /api/expert/questions/[id] — update question + replace options atomically
// DELETE /api/expert/questions/[id] — hard delete (cascade handles answer_options)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { questions, answerOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

// ── Zod helpers ───────────────────────────────────────────────────────────────
function zodIssueToMessage(issues: z.ZodIssue[]): string {
  return issues
    .map(i => `${i.path.join(".") || "input"}: ${i.message}`)
    .join(" · ");
}

// ── Schemas ───────────────────────────────────────────────────────────────────
// answerOptions.severity  → smallint (0–10)
// answerOptions.orderIndex → integer
// questions.minAge/maxAge  → smallint (0–120)
const optionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  labelBn: z.string().nullish(),
  value: z.string().min(1, "Option value is required"),
  severity: z.number().int().min(0).max(10).default(0),
  severityTag: z.enum(["none", "low", "moderate", "high", "critical"]).default("none"),
  orderIndex: z.number().int().default(0),
  nextQuestionId: z.string().uuid().nullish(),
  triggerConditionId: z.string().uuid().nullish(),
  endAssessment: z.boolean().default(false),
});

const updateSchema = z.object({
  // topicId intentionally excluded — moving a question between topics is a
  // destructive operation that should be a separate explicit action.
  text: z.string().min(1).optional(),
  textBn: z.string().nullish(),
  type: z.enum(["single", "multi", "scale", "date", "text", "colorpicker"]).optional(),
  required: z.boolean().optional(),
  active: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
  minAge: z.number().int().min(0).max(120).optional(),
  maxAge: z.number().int().min(0).max(120).optional(),
  targetGender: z.enum(["female", "male", "other", "prefer_not_to_say"]).nullish(),
  options: z.array(optionSchema).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!await requireExpert())
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  try {
    const body = updateSchema.parse(await req.json());
    const { options, ...questionFields } = body;

    // ── 1. Verify question exists BEFORE any writes ──────────────────────────
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "Question not found", code: "NOT_FOUND" }, { status: 404 });

    // ── 2. Update question fields (only what was sent) ───────────────────────
    // Keep null values (for nullish fields like textBn, targetGender) but drop
    // undefined (fields not included in the request body at all).
    const fieldsToUpdate = Object.fromEntries(
      Object.entries(questionFields).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(fieldsToUpdate).length > 0) {
      await db.update(questions).set(fieldsToUpdate).where(eq(questions.id, id));
    }

    // ── 3. Replace options atomically (delete-then-insert) ───────────────────
    // Only runs when `options` key is present in the request body.
    // Passing `options: []` deliberately clears all options.
    if (options !== undefined) {
      await db.delete(answerOptions).where(eq(answerOptions.questionId, id));

      if (options.length > 0) {
        await db.insert(answerOptions).values(
          options.map((o, i) => ({
            questionId: id,
            label: o.label,
            labelBn: o.labelBn ?? null,
            value: o.value,
            severity: o.severity,
            severityTag: o.severityTag,
            orderIndex: o.orderIndex ?? i,
            nextQuestionId: o.nextQuestionId ?? null,
            triggerConditionId: o.triggerConditionId ?? null,
            endAssessment: o.endAssessment,
          }))
        );
      }
    }

    // ── 4. Return fresh state ────────────────────────────────────────────────
    const [updated] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    const opts = await db
      .select()
      .from(answerOptions)
      .where(eq(answerOptions.questionId, id));

    return NextResponse.json({ ...updated, options: opts });

  } catch (e: any) {
    if (e.name === "ZodError")
      return NextResponse.json(
        { error: zodIssueToMessage(e.errors), code: "VALIDATION_ERROR", issues: e.errors },
        { status: 400 }
      );

    console.error("[PATCH /api/expert/questions/:id]", e?.message ?? e);
    return NextResponse.json(
      { error: "Internal server error: " + (e?.message ?? "unknown"), code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// answer_options are cleaned up automatically via ON DELETE CASCADE on question_id
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  if (!await requireExpert())
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning({ id: questions.id });

    if (!deleted)
      return NextResponse.json({ error: "Question not found", code: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ success: true, id: deleted.id });

  } catch (e: any) {
    console.error("[DELETE /api/expert/questions/:id]", e?.message ?? e);
    return NextResponse.json(
      { error: "Internal server error: " + (e?.message ?? "unknown"), code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}