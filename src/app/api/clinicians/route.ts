import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinicians } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db.select().from(clinicians).where(eq(clinicians.verified, true));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}
