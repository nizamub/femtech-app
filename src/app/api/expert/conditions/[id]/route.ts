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
  slug:             z.string().optional(),
  nameEn:           z.string().optional(),
  nameBn:           z.string().optional(),
  laypersonNameEn:  z.string().optional(),
  laypersonNameBn:  z.string().optional(),
  descriptionEn:    z.string().optional(),
  descriptionBn:    z.string().optional(),
  severity:         z.enum(["low","moderate","high","critical"]).optional(),
  urgencyLabel:     z.string().optional(),
  specialistType:   z.string().optional(),
  nextStepsEn:      z.string().optional(),
  nextStepsBn:      z.string().optional(),
  scoringThreshold: z.number().min(0).max(100).nullable().optional(),
  active:           z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const [updated] = await db.update(conditions).set({ ...data, updatedAt: new Date() }).where(eq(conditions.id, id)).returning();
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
