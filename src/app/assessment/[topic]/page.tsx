"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTopics, getSession, saveSession } from "@/lib/storage";
import { calculateTopicScore } from "@/lib/scoring";
import { TOPICS as TOPIC_META } from "@/lib/constants";
import type { Topic, UserAnswer } from "@/lib/types";

export default function TopicAssessmentPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: topicId } = use(params);
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionTopics, setSessionTopics] = useState<string[]>([]);

  useEffect(() => {
    const all = getTopics();
    const t = all.find(x => x.id === topicId);
    if (!t) { router.push("/assessment"); return; }
    setTopic(t);
    const sess = getSession();
    if (sess) {
      setSessionTopics(sess.topics.map(x => x.topicId));
      const existing = sess.topics.find(x => x.topicId === topicId);
      if (existing?.answers.length) setAnswers(existing.answers);
    }
  }, [topicId, router]);

  if (!topic) return <div className="flex-center" style={{ minHeight: "100vh" }}><div className="spinner" /></div>;

  const meta = TOPIC_META.find(t => t.id === topicId);
  const questions = topic.questions;
  const q = questions[currentQ];
  const progress = Math.round(((currentQ) / questions.length) * 100);
  const topicIndex = sessionTopics.indexOf(topicId);
  const nextTopicId = sessionTopics[topicIndex + 1];

  const selectAnswer = (value: string, severity: number) => {
    setSelected(value);
    const updated = [...answers];
    const idx = updated.findIndex(a => a.questionId === q.id);
    const ans: UserAnswer = { questionId: q.id, value, severity };
    if (idx >= 0) updated[idx] = ans; else updated.push(ans);
    setAnswers(updated);
  };

  const goNext = () => {
    if (!selected && q.required) return;
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      const existing = answers.find(a => a.questionId === questions[currentQ + 1]?.id);
      setSelected(existing?.value ?? null);
    } else {
      finishTopic();
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ(c => c - 1);
      const existing = answers.find(a => a.questionId === questions[currentQ - 1].id);
      setSelected(existing?.value ?? null);
    }
  };

  const finishTopic = () => {
    const sess = getSession();
    if (!sess) return;
    const score = calculateTopicScore(answers, questions);
    const updated = sess.topics.map(t =>
      t.topicId === topicId ? { ...t, answers, score, completed: true } : t
    );
    saveSession({ ...sess, topics: updated });
    if (nextTopicId) router.push(`/assessment/${nextTopicId}`);
    else router.push("/results");
  };

  const currentAnswer = answers.find(a => a.questionId === q.id);

  return (
    <div>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link href="/assessment" className="navbar-logo">
            <span style={{ fontSize: "1.4rem" }}>🌸</span>
            <span>Fem<span className="gradient-text">Health</span></span>
          </Link>
          <div className="flex gap-1" style={{ alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem" }}>{meta?.icon}</span>
            <span className="font-semibold text-sm" style={{ color: meta?.color }}>{topic.label}</span>
          </div>
        </div>
      </nav>

      <div className="container-sm section-sm animate-fade">
        {/* Progress */}
        <div className="mb-3">
          <div className="flex-between mb-1">
            <span className="text-xs text-muted">Question {currentQ + 1} of {questions.length}</span>
            <span className="text-xs font-semibold" style={{ color: meta?.color }}>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${meta?.color}99, ${meta?.color})` }} />
          </div>
        </div>

        {/* Topic indicator */}
        <div className="mb-3 flex gap-1" style={{ alignItems: "center" }}>
          {sessionTopics.map((tid, i) => (
            <div key={tid} style={{
              height: 4, flex: 1, borderRadius: 9999,
              background: tid === topicId ? (TOPIC_META.find(t=>t.id===tid)?.color ?? "var(--accent)") :
                sessionTopics.indexOf(topicId) > i ? "var(--success)" : "var(--surface-3)"
            }} />
          ))}
        </div>

        {/* Question Card */}
        <div key={q.id} className="question-card mb-3">
          <div className="text-xs text-muted mb-2 font-semibold" style={{ textTransform: "uppercase", letterSpacing: "0.06em", color: meta?.color }}>
            {topic.label}
          </div>
          <div className="question-text">{q.text}</div>
          <div>
            {q.options.map(opt => {
              const isSelected = (currentAnswer?.value ?? selected) === opt.value;
              return (
                <button
                  key={opt.value}
                  className={`option-btn${isSelected ? " selected" : ""}`}
                  onClick={() => selectAnswer(opt.value, opt.severity)}
                >
                  <span className={`option-radio${isSelected ? " selected" : ""}`}>
                    {isSelected && <span style={{ width:6,height:6,borderRadius:"50%",background:"white",display:"block",margin:"auto" }} />}
                  </span>
                  <span>{opt.label}</span>
                  {opt.severity > 0 && (
                    <span className="ml-auto text-xs" style={{ color: opt.severity >= 7 ? "var(--rose)" : opt.severity >= 4 ? "var(--amber)" : "var(--teal)", fontWeight: 600 }}>
                      {opt.severity >= 7 ? "⚠️ High" : opt.severity >= 4 ? "⚡ Moderate" : "✓ Mild"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-between">
          <button className="btn btn-ghost" onClick={goPrev} disabled={currentQ === 0}>
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={goNext}
            disabled={!currentAnswer && q.required}
          >
            {currentQ === questions.length - 1
              ? nextTopicId ? "Next Topic →" : "See Results →"
              : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
