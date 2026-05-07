// POST /api/assessment/[id]/complete — score + trigger conditions
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  assessments, assessmentAnswers, assessmentConditions,
  topicScores, conditions, conditionDirectTriggers,
  scoreThresholds, topics, answerOptions,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { id: assessmentId } = await params;
    const userId = (session.user as any).id as string;

    const [assessment] = await db.select().from(assessments)
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId))).limit(1);
    if (!assessment) return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    if (assessment.status === "completed") return NextResponse.json({ error: "Already completed", code: "ALREADY_COMPLETED" }, { status: 400 });

    // Load all answers for this assessment
    const answers = await db.select().from(assessmentAnswers).where(eq(assessmentAnswers.assessmentId, assessmentId));

    // Group by topic
    const byTopic: Record<string, typeof answers> = {};
    for (const a of answers) {
      if (!byTopic[a.topicId]) byTopic[a.topicId] = [];
      byTopic[a.topicId].push(a);
    }

    // Load topic weights
    const topicIds = Object.keys(byTopic);
    const topicList = topicIds.length > 0 ? await db.select().from(topics).where(inArray(topics.id, topicIds)) : [];
    const topicWeights: Record<string, number> = {};
    for (const t of topicList) topicWeights[t.id] = t.weight;

    // Per-topic scoring: avg severity / 10 * 100, weighted
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const topicScoreRows = [];

    for (const [topicId, topicAnswers] of Object.entries(byTopic)) {
      const rawScore = topicAnswers.reduce((s, a) => s + a.severity, 0);
      const maxScore = topicAnswers.length * 10;
      const score = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
      const weight = topicWeights[topicId] ?? 1;
      totalWeightedScore += score * weight;
      totalWeight += weight;
      topicScoreRows.push({ assessmentId, topicId, score, rawScore, maxScore });
    }

    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

    // Determine risk level from score thresholds
    const thresholds = await db.select().from(scoreThresholds);
    const riskLevel = thresholds.find(t => overallScore >= t.min && overallScore <= t.max)?.level ?? "low";

    // Insert topic scores
    if (topicScoreRows.length > 0) await db.insert(topicScores).values(topicScoreRows);

    // Detect triggered conditions
    const optionIds = answers.filter(a => a.optionId).map(a => a.optionId!);
    const triggeredConditionRows: { conditionId: string; matchedAnswerIds: string[]; probabilityLabel: string }[] = [];

    if (optionIds.length > 0) {
      const directTriggers = await db.select().from(conditionDirectTriggers)
        .where(inArray(conditionDirectTriggers.answerOptionId, optionIds));

      const triggered = new Map<string, string[]>();
      for (const t of directTriggers) {
        if (!triggered.has(t.conditionId)) triggered.set(t.conditionId, []);
        triggered.get(t.conditionId)!.push(t.answerOptionId);
      }

      for (const [conditionId, matchedIds] of triggered) {
        triggeredConditionRows.push({ conditionId, matchedAnswerIds: matchedIds, probabilityLabel: "Likely" });
      }
    }

    // Threshold-based conditions
    const allConditions = await db.select().from(conditions).where(eq(conditions.active, true));
    for (const cond of allConditions) {
      if (!cond.scoringThreshold) continue;
      if (triggeredConditionRows.some(r => r.conditionId === cond.id)) continue;
      if (overallScore >= cond.scoringThreshold) {
        triggeredConditionRows.push({ conditionId: cond.id, matchedAnswerIds: [], probabilityLabel: "Possible" });
      }
    }

    if (triggeredConditionRows.length > 0) {
      await db.insert(assessmentConditions).values(
        triggeredConditionRows.map(r => ({ assessmentId, conditionId: r.conditionId, probabilityLabel: r.probabilityLabel, matchedAnswerIds: r.matchedAnswerIds }))
      );
    }

    // Mark assessment complete
    await db.update(assessments).set({
      status: "completed",
      completedAt: new Date(),
      overallScore,
      riskLevel: riskLevel as "low" | "moderate" | "high" | "critical",
    }).where(eq(assessments.id, assessmentId));

    return NextResponse.json({ assessmentId, overallScore, riskLevel, conditionsTriggered: triggeredConditionRows.length });
  } catch (e) {
    console.error("[assessment/complete]", e);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
