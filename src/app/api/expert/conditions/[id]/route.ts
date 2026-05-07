// PATCH /api/expert/conditions/[id] — update
// DELETE /api/expert/conditions/[id] — deactivate
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { conditions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

const updateSchema = z.object({
  slug:             z.string().min(1).optional(),
  nameEn:           z.string().min(1).optional(),
  nameBn:           z.string().nullish(),
  laypersonNameEn:  z.string().min(1).optional(),
  laypersonNameBn:  z.string().nullish(),
  descriptionEn:    z.string().min(1).optional(),
  descriptionBn:    z.string().nullish(),
  severity:         z.enum(["low","moderate","high","critical"]).optional(),
  urgencyLabel:     z.string().optional(),
  specialistType:   z.string().nullish(),
  nextStepsEn:      z.string().nullish(),
  nextStepsBn:      z.string().nullish(),
  scoringThreshold: z.number().min(0).max(100).nullish(),   // ← .nullish() = null | undefined | number
  active:           z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const [updated] = await db.update(conditions).set({ ...data, updatedAt: new Date() }).where(eq(conditions.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Condition not found", code: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  await db.update(conditions).set({ active: false, updatedAt: new Date() }).where(eq(conditions.id, id));
  return NextResponse.json({ success: true });
}
