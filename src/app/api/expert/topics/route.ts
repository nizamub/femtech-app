import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { z } from "zod";
import { asc } from "drizzle-orm";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

const createSchema = z.object({
  label:       z.string().min(2),
  labelBn:     z.string().optional(),
  icon:        z.string().min(1),
  color:       z.string().min(4),
  description: z.string().optional(),
  visible:     z.boolean().default(true),
  orderIndex:  z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = await db.select().from(topics).orderBy(asc(topics.orderIndex));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = createSchema.parse(await req.json());
    const slug = data.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [created] = await db.insert(topics).values({ ...data, slug }).returning();
    return NextResponse.json({ ...created, questions: [] });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
