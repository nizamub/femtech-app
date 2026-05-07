import type { Question, UserAnswer, Thresholds } from "./types";
import { DEFAULT_THRESHOLDS } from "./constants";

/** Calculate a 0–100 score for a single topic */
export function calculateTopicScore(answers: UserAnswer[], questions: Question[]): number {
  if (!questions.length) return 0;
  const maxPossible = questions.reduce((sum, q) => {
    const maxSeverity = Math.max(...q.options.map((o) => o.severity));
    return sum + maxSeverity;
  }, 0);
  if (maxPossible === 0) return 0;
  const achieved = answers.reduce((sum, a) => sum + a.severity, 0);
  return Math.min(100, Math.round((achieved / maxPossible) * 100));
}

/** Calculate weighted overall score across all completed topics */
export function calculateOverallScore(
  topicScores: { score: number; weight: number }[]
): number {
  if (!topicScores.length) return 0;
  const totalWeight = topicScores.reduce((s, t) => s + t.weight, 0);
  const weightedSum = topicScores.reduce((s, t) => s + t.score * t.weight, 0);
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/** Get risk level and recommendation from a score */
export function getRecommendation(
  score: number,
  thresholds: Thresholds = DEFAULT_THRESHOLDS as Thresholds
) {
  const levels = Object.values(thresholds);
  for (const level of levels.reverse()) {
    if (score >= level.min) return level;
  }
  return thresholds.low;
}

/** Get a percentage fill for gauge visualization */
export function scoreToPercent(score: number): number {
  return Math.max(0, Math.min(100, score));
}
