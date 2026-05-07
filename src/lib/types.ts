export interface AnswerOption {
  label: string;
  value: string;
  severity: number; // 0–10
}

export interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
  required: boolean;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  questions: Question[];
  visible: boolean;
  weight: number; // topic weight multiplier, default 1
}

export interface UserAnswer {
  questionId: string;
  value: string;
  severity: number;
}

export interface TopicSession {
  topicId: string;
  answers: UserAnswer[];
  score: number; // 0–100 scaled
  completed: boolean;
}

export interface AssessmentSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  topics: TopicSession[];
  overallScore: number;
}

export interface ScoreThreshold {
  min: number;
  max: number;
  label: string;
  color: string;
  emoji: string;
  advice: string;
}

export interface Thresholds {
  low: ScoreThreshold;
  moderate: ScoreThreshold;
  high: ScoreThreshold;
  critical: ScoreThreshold;
}
