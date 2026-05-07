import type { Topic, AssessmentSession, Thresholds } from "./types";
import DEFAULT_TOPICS from "./defaultQuestions";
import { DEFAULT_THRESHOLDS } from "./constants";

const KEYS = {
  TOPICS: "femtech_topics",
  SESSION: "femtech_session",
  THRESHOLDS: "femtech_thresholds",
  EXPERT_AUTH: "femtech_expert_auth",
};

export function getTopics(): Topic[] {
  if (typeof window === "undefined") return DEFAULT_TOPICS;
  try {
    const stored = localStorage.getItem(KEYS.TOPICS);
    if (stored) return JSON.parse(stored) as Topic[];
  } catch {}
  return DEFAULT_TOPICS;
}

export function saveTopics(topics: Topic[]): void {
  localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));
}

export function resetTopics(): void {
  localStorage.setItem(KEYS.TOPICS, JSON.stringify(DEFAULT_TOPICS));
}

export function getSession(): AssessmentSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(KEYS.SESSION);
    if (stored) return JSON.parse(stored) as AssessmentSession;
  } catch {}
  return null;
}

export function saveSession(session: AssessmentSession): void {
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.SESSION);
}

export function getThresholds(): Thresholds {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS as Thresholds;
  try {
    const stored = localStorage.getItem(KEYS.THRESHOLDS);
    if (stored) return JSON.parse(stored) as Thresholds;
  } catch {}
  return DEFAULT_THRESHOLDS as Thresholds;
}

export function saveThresholds(thresholds: Thresholds): void {
  localStorage.setItem(KEYS.THRESHOLDS, JSON.stringify(thresholds));
}

export function setExpertAuth(value: boolean): void {
  if (value) sessionStorage.setItem(KEYS.EXPERT_AUTH, "true");
  else sessionStorage.removeItem(KEYS.EXPERT_AUTH);
}

export function isExpertAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEYS.EXPERT_AUTH) === "true";
}
