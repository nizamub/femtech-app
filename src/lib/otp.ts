import "server-only";
import { db } from "@/db";
import { otpTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Generate a 6-digit OTP, store it in DB (expires in 10 min), and email it */
export async function sendOtp(email: string, type: "verify" | "reset" = "verify") {
  const token = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing unused OTPs for this email+type
  await db
    .update(otpTokens)
    .set({ used: true })
    .where(and(eq(otpTokens.email, email.toLowerCase()), eq(otpTokens.type, type), eq(otpTokens.used, false)));

  // Insert fresh OTP
  await db.insert(otpTokens).values({
    email: email.toLowerCase(),
    token,
    type,
    expiresAt,
  });

  const subject = type === "verify"
    ? "Aura — Verify your email"
    : "Aura — Reset your password";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #065F46; margin: 0; font-size: 28px;">Aura</h1>
      </div>
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; color: #0F172A;">
        <h2 style="margin-top: 0;">${type === "verify" ? "Verify your email" : "Reset your password"}</h2>
        <p>Use the following code to ${type === "verify" ? "verify your account" : "reset your password"}. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #F8FAFC; border: 2px solid #065F46; border-radius: 12px; padding: 16px 40px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #065F46;">${token}</span>
          </div>
        </div>
        <p style="color: #64748B; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      </div>
      <p style="text-align: center; color: #64748B; font-size: 12px; margin-top: 24px;">
        Aura — Modern Serenity & Wellness Tech
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from:    process.env.RESEND_FROM ?? "Aura <onboarding@resend.dev>",
    to:      email,
    subject,
    html,
  });

  if (error) {
    // In development, Resend free tier only sends to the account owner's email.
    // Log the OTP to console so you can still test without a verified domain.
    console.warn(`⚠️  Resend could not deliver to ${email}: ${error.message}`);
    console.log(`🔑 OTP for ${email} (${type}): ${token}  ← use this to verify`);
    // Don't throw — allow registration to succeed so the flow can be tested
    // In production with a verified domain, this code path won't be hit
    return;
  }
}

/** Verify an OTP — returns true and marks used, or returns false */
export async function verifyOtp(email: string, token: string, type: "verify" | "reset" = "verify"): Promise<boolean> {
  const [otp] = await db
    .select()
    .from(otpTokens)
    .where(
      and(
        eq(otpTokens.email, email.toLowerCase()),
        eq(otpTokens.token, token),
        eq(otpTokens.type, type),
        eq(otpTokens.used, false),
        gt(otpTokens.expiresAt, new Date()),
      )
    )
    .limit(1);

  if (!otp) return false;

  await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.id, otp.id));
  return true;
}
