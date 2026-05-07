import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

const updateSchema = z.object({
  label:       z.string().min(2).optional(),
  labelBn:     z.string().optional(),
  icon:        z.string().min(1).optional(),
  color:       z.string().min(4).optional(),
  description: z.string().optional(),
  visible:     z.boolean().optional(),
  orderIndex:  z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const [updated] = await db.update(topics).set(data).where(eq(topics.id, id)).returning();
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  await db.delete(topics).where(eq(topics.id, id));
  return NextResponse.json({ success: true });
}
