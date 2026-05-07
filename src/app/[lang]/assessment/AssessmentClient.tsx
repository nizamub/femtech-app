"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import type { Locale } from "@/dictionaries";

interface Option { id: string; label: string; labelBn?: string | null; value: string; severity: number; endAssessment: boolean; }
interface Question { id: string; topicId: string; text: string; textBn?: string | null; type: string; options: Option[]; }
interface Topic { id: string; label: string; labelBn?: string | null; icon: string; color: string; description?: string | null; }

type Phase = "topic-select" | "assessment" | "submitting" | "done";

export default function AssessmentClient({
  lang, topics, userId, dict,
}: { lang: Locale; topics: (Topic & { questions: (Question & { options: Option[] })[] })[]; userId: string; dict: Record<string, any>; }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("topic-select");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionHistory, setQuestionHistory] = useState<Question[]>([]);
  const [answerHistory, setAnswerHistory] = useState<{ questionId: string; optionId?: string; freeTextValue?: string; numericValue?: number; severity: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const isBn = lang === "bn";

  const startAssessment = useCallback(async (topicId?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/assessment/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, ...(topicId ? { topicId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setSelectedTopic(data.topic);
      setAssessmentId(data.assessmentId);
      setCurrentQuestion(data.question);
      setQuestionHistory([]);
      setAnswerHistory([]);
      setProgress(0);
      setPhase("assessment");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [lang]);

  const submitAnswer = useCallback(async (option: Option) => {
    if (!assessmentId || !currentQuestion || loading) return;
    setSelectedOptionId(option.id); // For visual feedback before transition
    setLoading(true); setError(null);

    const answerData = { topicId: currentQuestion.topicId, questionId: currentQuestion.id, optionId: option.id, severity: option.severity };

    try {
      // Save to history for back button
      setQuestionHistory(h => [...h, currentQuestion]);
      setAnswerHistory(h => [...h, answerData]);

      if (option.endAssessment) {
        // Submit this answer then complete
        await fetch(`/api/assessment/${assessmentId}/answer`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answerData),
        });
        await completeAssessment();
        return;
      }

      const res = await fetch(`/api/assessment/${assessmentId}/answer`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answerData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      if (data.done || !data.nextQuestion) {
        await completeAssessment();
      } else {
        if (data.nextTopic) setSelectedTopic(data.nextTopic);
        setCurrentQuestion(data.nextQuestion);
        setSelectedOptionId(null); // Reset selection
        
        // Calculate a smoother progress based on history
        setProgress(p => Math.min(p + (100 / (topics.reduce((acc, t) => acc + t.questions.length, 0) || 10)), 95));
      }
    } catch (e: any) { setError(e.message); setQuestionHistory(h => h.slice(0, -1)); setAnswerHistory(h => h.slice(0, -1)); setSelectedOptionId(null); }
    finally { setLoading(false); }
  }, [assessmentId, currentQuestion, loading, topics]);

  const completeAssessment = async () => {
    if (!assessmentId) return;
    setProgress(100);
    setPhase("submitting");
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to complete");
      setPhase("done");
      router.push(`/${lang}/assessment/${assessmentId}/result`);
    } catch (e: any) { setError(e.message); setPhase("assessment"); }
  };

  const goBack = () => {
    if (questionHistory.length === 0) { setPhase("topic-select"); return; }
    const prev = questionHistory[questionHistory.length - 1];
    setCurrentQuestion(prev);
    setQuestionHistory(h => h.slice(0, -1));
    setAnswerHistory(h => h.slice(0, -1));
    setSelectedOptionId(null);
    setProgress(p => Math.max(p - (100 / (topics.reduce((acc, t) => acc + t.questions.length, 0) || 10)), 0));
  };

  // ── Topic Selection Screen ──────────────────────────────────────────────────
  if (phase === "topic-select") {
    const totalQuestions = topics.reduce((acc, t) => acc + t.questions.length, 0);

    return (
      <div className="min-h-[calc(100vh-60px)] bg-stone-50 py-10 px-4">
        <div className="max-w-4xl mx-auto animate-up">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold mb-5 uppercase tracking-wider">
              <Icons.Stethoscope size={14} />
              {isBn ? "স্বাস্থ্য মূল্যায়ন" : "Health Assessment"}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 mb-3 tracking-tight">
              {isBn ? "কোন বিষয়ে পরীক্ষা করতে চান?" : "What would you like to check?"}
            </h1>
            <p className="text-stone-500 font-medium max-w-xl mx-auto">
              {isBn
                ? "একটি নির্দিষ্ট স্বাস্থ্য বিষয় বেছে নিন, অথবা সম্পূর্ণ স্বাস্থ্য পরীক্ষার জন্য 'সবকিছু' বেছে নিন।"
                : "Pick a specific health topic, or choose \"Everything\" for a full comprehensive assessment."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2 max-w-lg mx-auto">
              <Icons.AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Everything card — always first */}
            <button
              onClick={() => startAssessment()}
              disabled={loading}
              className="group col-span-1 sm:col-span-2 lg:col-span-3 bg-gradient-to-br from-orange-700 to-orange-900 hover:from-orange-600 hover:to-orange-800 text-white rounded-3xl p-7 text-left transition-all shadow-lg hover:shadow-orange-700/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait flex items-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {loading
                  ? <Icons.Loader2 size={32} className="animate-spin" />
                  : <Icons.LayoutGrid size={32} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-extrabold mb-1">
                  {isBn ? "সম্পূর্ণ স্বাস্থ্য মূল্যায়ন" : "Full Assessment — Everything"}
                </div>
                <div className="text-orange-200 text-sm font-medium">
                  {isBn
                    ? `সকল ${topics.length}টি বিষয় • আনুমানিক ${totalQuestions} প্রশ্ন`
                    : `All ${topics.length} topics · ~${totalQuestions} questions · Comprehensive report`}
                </div>
              </div>
              <Icons.ArrowRight size={24} className="shrink-0 opacity-60 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Divider */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                {isBn ? "অথবা একটি বিষয় বেছে নিন" : "Or choose a specific topic"}
              </span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Individual topic cards */}
            {topics.map((topic) => {
              const IconComp = (Icons as any)[topic.icon] || Icons.Activity;
              const isLucide = !!(Icons as any)[topic.icon];
              const questionCount = topic.questions.length;
              const description = (topic as any).description;

              return (
                <button
                  key={topic.id}
                  onClick={() => startAssessment(topic.id)}
                  disabled={loading || questionCount === 0}
                  className="group bg-white hover:bg-stone-50 border border-stone-200 hover:border-orange-300 rounded-2xl p-6 text-left transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col gap-4"
                >
                  {/* Icon + count */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border"
                      style={{ color: topic.color, backgroundColor: `${topic.color}18`, borderColor: `${topic.color}30` }}
                    >
                      {isLucide ? <IconComp size={24} /> : <span className="text-2xl">{topic.icon}</span>}
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full border"
                      style={{ color: topic.color, backgroundColor: `${topic.color}12`, borderColor: `${topic.color}25` }}
                    >
                      {questionCount} {isBn ? "প্রশ্ন" : "q"}
                    </span>
                  </div>

                  {/* Label */}
                  <div>
                    <div className="font-bold text-stone-900 text-base mb-1" style={{ color: topic.color }}>
                      {(isBn && (topic as any).labelBn) ? (topic as any).labelBn : topic.label}
                    </div>
                    {description && (
                      <div className="text-stone-500 text-xs font-medium leading-relaxed line-clamp-2">
                        {description}
                      </div>
                    )}
                    {questionCount === 0 && (
                      <div className="text-amber-600 text-xs font-bold mt-1">No questions yet</div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 text-xs font-bold mt-auto" style={{ color: topic.color }}>
                    {isBn ? "শুরু করুন" : "Start"}
                    <Icons.ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (phase === "submitting" || phase === "done") {
    return (
      <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center gap-6 bg-stone-50 relative overflow-hidden p-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center animate-up">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl animate-pulse" />
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center relative border border-emerald-50">
              <Icons.Activity className="text-orange-600" size={40} />
            </div>
            <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="transparent" stroke="#E2E8F0" strokeWidth="6" />
              <circle cx="50" cy="50" r="46" fill="transparent" stroke="#047857" strokeWidth="6" strokeDasharray="289" strokeDashoffset="289" className="animate-[dash_2s_ease-in-out_infinite]" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {isBn ? "ফলাফল তৈরি হচ্ছে..." : "Analyzing your data"}
          </h2>
          <p className="text-stone-500 font-medium text-lg">
            {isBn ? "আপনার তথ্য যাচাই করা হচ্ছে" : "Generating your personalized clinical insights..."}
          </p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash {
            0% { stroke-dashoffset: 289; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -289; }
          }
        `}} />
      </div>
    );
  }

  // ── Question ───────────────────────────────────────────────────────────────
  if (!currentQuestion) return null;
  const questionText = (isBn && currentQuestion.textBn) ? currentQuestion.textBn : currentQuestion.text;
  const IconComponent = selectedTopic ? ((Icons as any)[selectedTopic.icon] || Icons.Activity) : Icons.Activity;

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center pt-8 pb-20 px-4 sm:px-6 bg-stone-50">
      <div className="w-full max-w-2xl relative">
        
        {/* Progress Bar (Sticky Top) */}
        <div className="sticky top-4 z-20 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} disabled={loading} className="p-2 rounded-xl text-stone-400 hover:text-slate-700 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Icons.ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                {selectedTopic && (
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    <IconComponent size={14} /> 
                    {isBn && selectedTopic.labelBn ? selectedTopic.labelBn : selectedTopic.label}
                  </span>
                )}
                <span className="text-xs font-bold text-stone-400">{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700 ease-out" />
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="animate-up" key={currentQuestion.id}>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-8 px-2 tracking-tight">
            {questionText}
          </h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm mb-6 font-bold flex items-center gap-2">
              <Icons.AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Single / Multi choice */}
          {(currentQuestion.type === "single" || currentQuestion.type === "multi") && (
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt, index) => {
                const label = (isBn && opt.labelBn) ? opt.labelBn : opt.label;
                const isSelected = selectedOptionId === opt.id;
                
                return (
                  <button 
                    key={opt.id} 
                    onClick={() => submitAnswer(opt)} 
                    disabled={loading}
                    className={`group relative text-left p-5 border-2 rounded-2xl cursor-pointer text-[1.05rem] font-semibold transition-all duration-200 overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30
                      ${isSelected 
                        ? 'border-emerald-600 bg-orange-50/50 text-orange-900 shadow-md scale-[0.99] translate-y-0.5' 
                        : 'border-white bg-white text-slate-700 shadow-sm hover:border-orange-200 hover:shadow-md hover:bg-orange-50/20'
                      }
                      ${loading && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="pr-4">{label}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${isSelected ? 'border-emerald-600 bg-orange-600' : 'border-stone-200 bg-stone-50 group-hover:border-emerald-300'}
                      `}>
                        {isSelected && <Icons.Check size={14} className="text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Scale */}
          {currentQuestion.type === "scale" && (
            <div className="bg-white border border-white shadow-sm rounded-3xl p-8">
              <div className="mb-12 relative pt-6">
                <input 
                  type="range" 
                  min={1} 
                  max={5} 
                  defaultValue={3} 
                  id="scale-input" 
                  className="w-full h-3 bg-stone-100 rounded-full appearance-none outline-none focus:ring-4 focus:ring-orange-500/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-orange-600 hover:[&::-webkit-slider-thumb]:scale-110 transition-all" 
                />
                <div className="absolute top-0 left-0 w-full flex justify-between text-xs font-bold text-stone-400">
                  <span>1 — Mild</span>
                  <span>3 — Moderate</span>
                  <span>5 — Severe</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const val = parseInt((document.getElementById("scale-input") as HTMLInputElement).value);
                  const syntheticOpt = currentQuestion.options[val - 1] ?? currentQuestion.options[currentQuestion.options.length - 1];
                  if (syntheticOpt) submitAnswer(syntheticOpt);
                }} 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-wait"
              >
                {loading ? <Icons.Loader2 className="animate-spin" size={20} /> : (isBn ? "পরবর্তী" : "Continue")}
                {!loading && <Icons.ArrowRight size={20} />}
              </button>
            </div>
          )}

          {/* Text */}
          {currentQuestion.type === "text" && (
            <div className="bg-white border border-white shadow-sm rounded-3xl p-6">
              <textarea 
                id="text-input" 
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 min-h-[160px] mb-6 transition-all font-medium resize-y" 
                placeholder={isBn ? "এখানে লিখুন..." : "Type your answer in detail..."} 
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById("text-input") as HTMLTextAreaElement).value;
                  if (val.trim()) submitAnswer({ id: "text", label: val, value: val, severity: 0, endAssessment: false });
                }} 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-wait"
              >
                {loading ? <Icons.Loader2 className="animate-spin" size={20} /> : (isBn ? "পরবর্তী" : "Continue")}
                {!loading && <Icons.ArrowRight size={20} />}
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => { if(confirm("End the assessment early?")) completeAssessment(); }} 
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 font-semibold text-sm transition-colors border-b border-transparent hover:border-slate-300 pb-0.5 disabled:opacity-50"
          >
            {isBn ? "মূল্যায়ন শেষ করুন" : "Save and finish assessment early"}
          </button>
        </div>
      </div>
    </div>
  );
}
