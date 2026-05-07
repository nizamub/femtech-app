import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clinicians } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

async function requireExpert() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  return session?.user && (role === "expert" || role === "admin") ? session : null;
}

export async function GET() {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const all = await db.select().from(clinicians).orderBy(asc(clinicians.name));
  return NextResponse.json(all);
}

const createSchema = z.object({
  name:      z.string().min(2),
  specialty: z.string().optional(),
  address:   z.string().optional(),
  lat:       z.number().nullable().optional(),
  lng:       z.number().nullable().optional(),
  phone:     z.string().optional(),
  email:     z.string().email().optional().or(z.literal("")),
  website:   z.string().optional(),
  verified:  z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  if (!await requireExpert()) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = createSchema.parse(await req.json());
    // Convert empty string email to null for DB if necessary, but DB schema allows string. 
    // Just pass it as is, or omit if empty.
    const [clinician] = await db.insert(clinicians).values({
      ...data,
      email: data.email || null,
    }).returning();
    return NextResponse.json(clinician, { status: 201 });
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR", issues: e.errors }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
