import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";

const Schema = z.object({
  email: z.email(),
  token: z.string().length(6),
  type:  z.enum(["verify", "reset"]).default("verify"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, token, type } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const isValid = await verifyOtp(normalizedEmail, token, type);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    if (type === "verify") {
      // Mark email verified
      await db.update(users).set({ emailVerified: true }).where(eq(users.email, normalizedEmail));
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
