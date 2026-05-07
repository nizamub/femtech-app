import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendOtp } from "@/lib/otp";

const RegisterSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.email("Invalid email address"),
  password: z.string()
    .min(8,  "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Must contain at least one letter")
    .regex(/[0-9]/,    "Must contain at least one number"),
  age:      z.number().int().min(10).max(120).optional(),
  gender:   z.enum(["female", "male", "other", "prefer_not_to_say"]).optional(),
  role:     z.enum(["user", "expert"]).default("user"),
  language: z.enum(["en", "bn"]).default("en"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, age, gender, role, language } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check existing user
    const [existing] = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
      // User exists but unverified — resend OTP
      await sendOtp(normalizedEmail, "verify");
      return NextResponse.json({ message: "Verification email resent", userId: existing.id }, { status: 200 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user (unverified)
    const [newUser] = await db
      .insert(users)
      .values({
        name:         name.trim(),
        email:        normalizedEmail,
        passwordHash,
        emailVerified: false,
        role,
        age:          age ?? null,
        gender:       gender ?? null,
        language,
      })
      .returning({ id: users.id });

    // Send OTP
    await sendOtp(normalizedEmail, "verify");

    return NextResponse.json({ message: "Account created. Please verify your email.", userId: newUser.id }, { status: 201 });

  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
