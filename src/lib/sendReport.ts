import "server-only";
import { Resend } from "resend";
import { db } from "@/db";
import { assessments, topicScores, topics, users, assessmentAnswers, questions, answerOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

const riskColor = { low: "#059669", moderate: "#F59E0B", high: "#EA580C", critical: "#DC2626" };
const riskLabel = { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk", critical: "Critical" };
const riskAdvice = {
  low: "You appear to be in good health. Continue maintaining healthy lifestyle habits and schedule regular check-ups.",
  moderate: "Some health concerns have been identified. We recommend consulting a registered clinician within 2–4 weeks for a professional evaluation.",
  high: "Significant health risks detected. Please see a registered clinician within the next week. Do not ignore these symptoms.",
  critical: "Your responses indicate serious health concerns. Please seek immediate medical attention. Contact a healthcare provider today.",
};

export async function sendHealthReport(assessmentId: string) {
  try {
    // Fetch assessment + user
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
    if (!assessment || !assessment.completedAt) return;

    const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, assessment.userId)).limit(1);
    if (!user) return;

    // Fetch topic scores
    const scores = await db
      .select({ score: topicScores.score, topicLabel: topics.label, topicIcon: topics.icon, topicColor: topics.color })
      .from(topicScores)
      .leftJoin(topics, eq(topicScores.topicId, topics.id))
      .where(eq(topicScores.assessmentId, assessmentId));

    const risk = assessment.riskLevel ?? "low";
    const overallScore = Math.round(assessment.overallScore ?? 0);
    const dateStr = new Date(assessment.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const topicRows = scores.map(s => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0;">
          ${s.topicIcon ?? "🩺"} <strong>${s.topicLabel ?? "Topic"}</strong>
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; text-align: right;">
          <span style="font-weight: 700; color: ${s.score >= 70 ? "#DC2626" : s.score >= 40 ? "#F97316" : "#059669"};">
            ${Math.round(s.score)}%
          </span>
        </td>
      </tr>
    `).join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;color:#0F172A;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#065F46;margin:0;font-size:28px;">Aura</h1>
      <p style="color:#64748B;margin:4px 0 0;">Modern Serenity & Wellness Tech</p>
    </div>

    <!-- Greeting -->
    <div style="background:#FFFFFF;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #E2E8F0;">
      <h2 style="margin:0 0 8px;color:#0F172A;">Hello, ${user.name} 👋</h2>
      <p style="margin:0;color:#64748B;font-size:14px;">Your health assessment report from <strong>${dateStr}</strong> is ready.</p>
    </div>

    <!-- Overall Score -->
    <div style="background:#FFFFFF;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;border:1px solid #E2E8F0;">
      <div style="font-size:13px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Overall Health Score</div>
      <div style="font-size:64px;font-weight:900;color:${riskColor[risk]};line-height:1;">${overallScore}%</div>
      <div style="display:inline-block;background:${riskColor[risk]}20;color:${riskColor[risk]};border:1px solid ${riskColor[risk]}40;border-radius:99px;padding:6px 20px;font-weight:700;margin-top:12px;">
        ${riskLabel[risk]}
      </div>
    </div>

    <!-- Advice -->
    <div style="background:${riskColor[risk]}15;border:1px solid ${riskColor[risk]}40;border-radius:16px;padding:20px;margin-bottom:24px;">
      <h3 style="margin:0 0 8px;color:${riskColor[risk]};">💡 Recommendation</h3>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">${riskAdvice[risk]}</p>
    </div>

    <!-- Topic breakdown -->
    <div style="background:#FFFFFF;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #E2E8F0;">
      <h3 style="margin:0 0 16px;color:#0F172A;">📊 Topic Breakdown</h3>
      <table style="width:100%;border-collapse:collapse;color:#475569;font-size:14px;">
        ${topicRows}
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#64748B;font-size:12px;">
      <p>This report is for informational purposes only and does not replace professional medical advice.</p>
      <p style="margin-top:8px;color:#94A3B8;">© 2025 Aura — Modern Serenity & Wellness Tech</p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from:    process.env.RESEND_FROM!,
      to:      user.email,
      subject: `Your Aura Report — ${dateStr}`,
      html,
    });

    // Mark report as sent
    await db.update(assessments).set({ reportSent: true }).where(eq(assessments.id, assessmentId));

  } catch (err) {
    console.error("sendHealthReport error:", err);
  }
}
