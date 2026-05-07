"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTopics, clearSession, saveSession } from "@/lib/storage";
import type { Topic, AssessmentSession } from "@/lib/types";

export default function AssessmentPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const t = getTopics().filter(t => t.visible);
    setTopics(t);
  }, []);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelected(topics.map(t => t.id));
  const clearAll = () => setSelected([]);

  const startAssessment = () => {
    if (!selected.length) return;
    clearSession();
    const session: AssessmentSession = {
      id: Date.now().toString(),
      startedAt: new Date().toISOString(),
      topics: selected.map(id => ({ topicId: id, answers: [], score: 0, completed: false })),
      overallScore: 0,
    };
    saveSession(session);
    router.push(`/assessment/${selected[0]}`);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="navbar-logo">
            <span style={{ fontSize: "1.4rem" }}>🌸</span>
            <span>Fem<span className="gradient-text">Health</span></span>
          </Link>
          <span className="badge" style={{ background: "rgba(192,132,252,0.1)", color: "var(--accent)", border: "1px solid rgba(192,132,252,0.3)" }}>
            Step 1 of 3
          </span>
        </div>
      </nav>

      <div className="container-sm section-sm">
        <div className="text-center mb-4 animate-fade">
          <h2>Select Health Topics</h2>
          <p className="mt-1">Choose the areas you want to be screened for. You can select multiple topics.</p>
        </div>

        <div className="flex-between mb-3">
          <span className="text-sm text-muted">{selected.length} of {topics.length} selected</span>
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-sm" onClick={selectAll}>Select All</button>
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear</button>
          </div>
        </div>

        <div className="grid-2 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {topics.map(t => (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`topic-card${selected.includes(t.id) ? " selected" : ""}`}
              style={{ borderColor: selected.includes(t.id) ? t.color : undefined }}
            >
              <div className="topic-icon">{t.icon}</div>
              <div className="topic-label" style={{ color: t.color }}>{t.label}</div>
              <div className="topic-desc">{t.description}</div>
              {selected.includes(t.id) && (
                <div style={{ fontSize: "0.75rem", color: t.color, fontWeight: 600 }}>✓ Selected</div>
              )}
            </button>
          ))}
        </div>

        <div className="disclaimer-banner mb-3">
          <span>⚠️</span>
          <span>This screening is for informational purposes only and does not replace professional medical diagnosis.</span>
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={startAssessment}
          disabled={!selected.length}
        >
          Begin Assessment ({selected.length} topic{selected.length !== 1 ? "s" : ""}) →
        </button>
      </div>
    </div>
  );
}
