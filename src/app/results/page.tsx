"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, getTopics, getThresholds, clearSession } from "@/lib/storage";
import { calculateOverallScore, getRecommendation } from "@/lib/scoring";
import { TOPICS as TOPIC_META } from "@/lib/constants";
import type { AssessmentSession } from "@/lib/types";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [animated, setAnimated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sess = getSession();
    if (!sess) { router.push("/assessment"); return; }
    const topics = getTopics();
    const completed = sess.topics.filter(t => t.completed);
    const scores = completed.map(t => {
      const meta = topics.find(x => x.id === t.topicId);
      return { score: t.score, weight: meta?.weight ?? 1 };
    });
    const overall = calculateOverallScore(scores);
    const updated = { ...sess, overallScore: overall, completedAt: new Date().toISOString() };
    setSession(updated);
    setOverallScore(overall);
    setTimeout(() => setAnimated(true), 100);
  }, [router]);

  const thresholds = getThresholds();
  const recommendation = getRecommendation(overallScore, thresholds);

  const completedTopics = session?.topics.filter(t => t.completed) ?? [];

  const barData = {
    labels: completedTopics.map(t => TOPIC_META.find(m => m.id === t.topicId)?.label ?? t.topicId),
    datasets: [{
      label: "Topic Score",
      data: completedTopics.map(t => t.score),
      backgroundColor: completedTopics.map(t => {
        const color = TOPIC_META.find(m => m.id === t.topicId)?.color ?? "#8B5CF6";
        return color + "99";
      }),
      borderColor: completedTopics.map(t => TOPIC_META.find(m => m.id === t.topicId)?.color ?? "#8B5CF6"),
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const gaugeData = {
    datasets: [{
      data: [overallScore, 100 - overallScore],
      backgroundColor: [recommendation.color, "rgba(255,255,255,0.05)"],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }],
  };

  const handlePrint = () => window.print();

  const handleRetake = () => { clearSession(); router.push("/assessment"); };

  if (!session) return <div className="flex-center" style={{ minHeight: "100vh" }}><div className="spinner" /></div>;

  return (
    <div ref={printRef}>
      <nav className="navbar" style={{ printColorAdjust: "exact" }}>
        <div className="container navbar-inner">
          <Link href="/" className="navbar-logo">
            <span style={{ fontSize: "1.4rem" }}>🌸</span>
            <span>Fem<span className="gradient-text">Health</span></span>
          </Link>
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-sm" onClick={handlePrint}>🖨️ Print Report</button>
            <button className="btn btn-secondary btn-sm" onClick={handleRetake}>Retake</button>
          </div>
        </div>
      </nav>

      <div className="container-sm section-sm animate-fade">
        {/* Overall Score Gauge */}
        <div className="card card-glow text-center mb-4" style={{
          background: `linear-gradient(135deg, ${recommendation.color}15, rgba(30,24,48,0.9))`
        }}>
          <div className="mb-2 text-sm font-semibold" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Your Overall Health Score
          </div>
          <div style={{ maxWidth: 280, margin: "0 auto", position: "relative" }}>
            <Doughnut data={gaugeData} options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: "75%" }} />
            <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: recommendation.color, lineHeight: 1 }}>
                {animated ? overallScore : 0}
              </div>
              <div className="text-xs text-muted">out of 100</div>
            </div>
          </div>
          <div className="mt-2">
            <span className="badge" style={{ background: recommendation.color + "25", color: recommendation.color, border: `1px solid ${recommendation.color}50`, fontSize: "1rem", padding: "0.4rem 1.2rem" }}>
              {recommendation.emoji} {recommendation.label}
            </span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="card mb-4" style={{ border: `1.5px solid ${recommendation.color}40`, background: recommendation.color + "0d" }}>
          <div className="flex gap-2" style={{ alignItems: "flex-start" }}>
            <span style={{ fontSize: "2.5rem" }}>{recommendation.emoji}</span>
            <div>
              <h3 className="mb-1" style={{ color: recommendation.color }}>Clinical Recommendation</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{recommendation.advice}</p>
            </div>
          </div>
        </div>

        {/* Per-Topic Breakdown */}
        {completedTopics.length > 1 && (
          <div className="card mb-4">
            <h3 className="mb-3">Topic Breakdown</h3>
            <div style={{ height: 220 }}>
              <Bar data={barData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { min: 0, max: 100, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#7a6f96" } },
                  x: { grid: { display: false }, ticks: { color: "#7a6f96", font: { size: 11 } } },
                },
              }} />
            </div>
          </div>
        )}

        {/* Topic Details */}
        <div className="card mb-4">
          <h3 className="mb-3">Topic-by-Topic Results</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {completedTopics.map(t => {
              const meta = TOPIC_META.find(m => m.id === t.topicId);
              const rec = getRecommendation(t.score, thresholds);
              return (
                <div key={t.topicId}>
                  <div className="flex-between mb-1">
                    <div className="flex gap-1" style={{ alignItems: "center" }}>
                      <span>{meta?.icon}</span>
                      <span className="font-semibold text-sm" style={{ color: meta?.color }}>{meta?.label}</span>
                    </div>
                    <div className="flex gap-1" style={{ alignItems: "center" }}>
                      <span className="text-xs" style={{ color: rec.color }}>{rec.emoji} {rec.label}</span>
                      <span className="font-bold text-sm" style={{ color: meta?.color }}>{t.score}/100</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${t.score}%`, background: `linear-gradient(90deg, ${meta?.color}80, ${meta?.color})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Scale Reference */}
        <div className="card mb-4">
          <h3 className="mb-3">Risk Scale Reference</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.values(thresholds).map(t => (
              <div key={t.label} className="flex-between" style={{
                padding: "0.6rem 1rem",
                borderRadius: "var(--radius)",
                background: t.color + "10",
                border: `1px solid ${t.color}30`
              }}>
                <div className="flex gap-1" style={{ alignItems: "center" }}>
                  <span>{t.emoji}</span>
                  <span className="font-semibold text-sm" style={{ color: t.color }}>{t.label}</span>
                </div>
                <span className="text-xs text-muted">{t.min}–{t.max} points</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="disclaimer-banner mb-3">
          <span>⚠️</span>
          <span>This assessment is a screening tool only. Always consult a registered healthcare professional for diagnosis and treatment.</span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handlePrint}>
            🖨️ Print / Save Report
          </button>
          <Link href="/assessment" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => clearSession()}>
            🔄 New Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
