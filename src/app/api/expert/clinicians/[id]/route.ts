import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clinicians } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

const updateSchema = z.object({
  name:      z.string().min(2).optional(),
  specialty: z.string().nullable().optional(),
  address:   z.string().nullable().optional(),
  lat:       z.number().nullable().optional(),
  lng:       z.number().nullable().optional(),
  phone:     z.string().nullable().optional(),
  email:     z.string().email().nullable().optional().or(z.literal("")),
  website:   z.string().nullable().optional(),
  verified:  z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const [updated] = await db.update(clinicians)
      .set({ ...data, email: data.email || null })
      .where(eq(clinicians.id, id))
      .returning();
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  await db.delete(clinicians).where(eq(clinicians.id, id));
  return NextResponse.json({ success: true });
}
