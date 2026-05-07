// GET /api/expert/conditions — list all conditions
// POST /api/expert/conditions — create condition
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { conditions, conditionTopicMap, conditionDirectTriggers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

export async function GET() {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const all = await db.select().from(conditions).orderBy(asc(conditions.nameEn));
  return NextResponse.json(all);
}

const createSchema = z.object({
  slug:             z.string().min(2),
  nameEn:           z.string().min(2),
  nameBn:           z.string().optional(),
  laypersonNameEn:  z.string().min(2),
  laypersonNameBn:  z.string().optional(),
  descriptionEn:    z.string().min(10),
  descriptionBn:    z.string().optional(),
  severity:         z.enum(["low","moderate","high","critical"]).default("moderate"),
  urgencyLabel:     z.string().default("Within 1 week"),
  specialistType:   z.string().optional(),
  nextStepsEn:      z.string().optional(),
  nextStepsBn:      z.string().optional(),
  scoringThreshold: z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = createSchema.parse(await req.json());
    const [cond] = await db.insert(conditions).values({ ...data, active: true }).returning();
    return NextResponse.json(cond, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR", issues: e.errors }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
