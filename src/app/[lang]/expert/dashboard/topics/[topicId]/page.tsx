"use client";
import { useEffect, useState, use, useRef } from "react";
import { getTopics, saveTopics } from "@/lib/storage";
import { TOPICS as TOPIC_META, SEVERITY_LABELS } from "@/lib/constants";
import type { Topic, Question, AnswerOption } from "@/lib/types";
import Link from "next/link";
import { ChevronLeft, Save, CheckCircle2, Plus, Trash2, HelpCircle, Settings, ChevronDown, Activity, X } from "lucide-react";
import * as Icons from "lucide-react";

const PRESET_IDS = new Set([
  "hepatitis","pregnancy-problems","arsenic","menstrual","viral",
  "nutrition","pregnancy-care","birth-control","hpv-vaccination",
  "breast-cancer","thyroid","iron-deficiency",
]);

const ICON_SUGGESTIONS = [
  "Activity", "Heart", "Brain", "Bone", "Droplet", "Eye", "Thermometer", "Stethoscope",
  "Pill", "Syringe", "Microscope", "Dna", "TestTube", "Baby", "Salad", "Apple", "Dumbbell"
];

const COLOR_PALETTE = [
  "#065F46", "#047857", "#059669", "#10B981", "#34D399",
  "#0F766E", "#0E7490", "#0369A1", "#1D4ED8", "#4338CA",
  "#6D28D9", "#A21CAF", "#BE185D", "#E11D48", "#C2410C",
  "#B45309", "#0F172A", "#334155", "#475569", "#64748B"
];

function OptionRow({ opt, onChange, onDelete }: { opt: AnswerOption; onChange: (o: AnswerOption) => void; onDelete: () => void }) {
  const isHighRisk = opt.severity >= 7;
  const isMedRisk = opt.severity >= 4 && opt.severity < 7;
  const severityColor = isHighRisk ? "text-red-600" : isMedRisk ? "text-orange-500" : "text-orange-500";
  const severityAccent = isHighRisk ? "accent-red-600" : isMedRisk ? "accent-orange-500" : "accent-orange-600";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-stone-50 border border-stone-200 rounded-xl p-3">
      <input 
        className="flex-2 min-w-[120px] w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" 
        value={opt.label} 
        placeholder="Option label..." 
        onChange={e => onChange({ ...opt, label: e.target.value })} 
      />
      <input 
        className="w-full sm:w-[120px] px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium font-mono" 
        value={opt.value} 
        placeholder="value-key" 
        onChange={e => onChange({ ...opt, value: e.target.value })} 
      />
      
      <div className="flex flex-col gap-1 w-full sm:w-[160px] shrink-0 bg-white p-2 rounded-lg border border-stone-200">
        <div className="flex justify-between items-center text-[0.7rem] uppercase tracking-wider font-bold">
          <span className="text-stone-400">Sev: {opt.severity}</span>
          <span className={severityColor}>
            {SEVERITY_LABELS[opt.severity]}
          </span>
        </div>
        <input 
          type="range" 
          min={0} max={10} 
          value={opt.severity} 
          onChange={e => onChange({ ...opt, severity: Number(e.target.value) })} 
          className={`w-full ${severityAccent} cursor-pointer`} 
        />
      </div>

      <button className="p-2.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 self-end sm:self-auto" onClick={onDelete} title="Remove Option">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

function QuestionEditor({ q, index, onChange, onDelete }: { q: Question; index: number; onChange: (q: Question) => void; onDelete: () => void }) {
  const addOption = () => onChange({ ...q, options: [...q.options, { label: "", value: `opt-${Date.now()}`, severity: 0 }] });
  const updateOpt = (i: number, opt: AnswerOption) => onChange({ ...q, options: q.options.map((o, idx) => idx === i ? opt : o) });
  const deleteOpt = (i: number) => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) });

  return (
    <div className="bg-white border-l-4 border-emerald-600 border-y border-r border-stone-200 rounded-r-2xl rounded-l-md p-6 mb-6 shadow-sm animate-up">
      <div className="flex justify-between items-start mb-4">
        <span className="bg-orange-50 text-orange-700 font-bold text-xs px-3 py-1 rounded-full border border-orange-200 uppercase tracking-wide">Question {index + 1}</span>
        <button className="text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-sm font-semibold" onClick={onDelete}>
          <Trash2 size={16} /> Delete
        </button>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Question Text</label>
        <textarea 
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium resize-y min-h-[80px]" 
          value={q.text} 
          placeholder="Enter the question text here..."
          onChange={e => onChange({ ...q, text: e.target.value })} 
        />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide m-0">Answer Options</label>
          <button className="flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors border border-orange-200" onClick={addOption}>
            <Plus size={14} /> Add Option
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {q.options.map((opt, i) => (
            <OptionRow key={i} opt={opt} onChange={o => updateOpt(i, o)} onDelete={() => deleteOpt(i)} />
          ))}
          {q.options.length === 0 && (
            <div className="text-center p-4 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 font-medium text-sm">
              No options added yet. Click "Add Option" to create one.
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-600 select-none bg-stone-50 w-fit px-3 py-2 rounded-lg border border-stone-200">
        <input 
          type="checkbox" 
          checked={q.required} 
          onChange={e => onChange({ ...q, required: e.target.checked })} 
          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 accent-orange-600"
        />
        Required question
      </label>
    </div>
  );
}

export default function TopicQuestionEditorPage({ params }: { params: Promise<{ topicId: string; lang: string }> }) {
  const { topicId, lang } = use(params);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "details">("questions");

  // Editable meta (for custom topics)
  const [metaLabel, setMetaLabel] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaIcon, setMetaIcon] = useState("");
  const [metaColor, setMetaColor] = useState("#065F46");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  const isCustom = !PRESET_IDS.has(topicId);

  useEffect(() => {
    const all = getTopics();
    const t = all.find(x => x.id === topicId);
    if (t) {
      setTopic(t);
      setQuestions(t.questions);
      setMetaLabel(t.label);
      setMetaDesc(t.description);
      setMetaIcon(t.icon);
      setMetaColor(t.color || "#065F46");
    }
  }, [topicId]);

  // Close icon picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const meta = TOPIC_META.find(m => m.id === topicId);
  const displayIcon  = isCustom ? metaIcon  : (meta?.icon  ?? topic?.icon  ?? "Activity");
  const displayColor = isCustom ? metaColor : (meta?.color ?? topic?.color ?? "#065F46");
  const displayLabel = isCustom ? metaLabel : (topic?.label ?? "");

  const addQuestion = () => {
    const q: Question = { id: `q-${Date.now()}`, text: "", options: [], required: true };
    setQuestions(prev => [...prev, q]);
  };
  const updateQ = (i: number, q: Question) => setQuestions(prev => prev.map((x, idx) => idx === i ? q : x));
  const deleteQ = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));

  const save = () => {
    if (!topic) return;
    const all = getTopics();
    const updated = all.map(t => {
      if (t.id !== topicId) return t;
      const base = { ...t, questions };
      if (isCustom) {
        return { ...base, label: metaLabel.trim() || t.label, description: metaDesc.trim() || t.description, icon: metaIcon || t.icon, color: metaColor };
      }
      return base;
    });
    saveTopics(updated);
    // Refresh local topic state
    const refreshed = updated.find(t => t.id === topicId);
    if (refreshed) setTopic(refreshed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!topic) return (
    <div className="flex justify-center items-center min-h-[300px]">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
    </div>
  );

  const DisplayIconComp = (Icons as any)[displayIcon] || Icons.Activity;
  const isDisplayLucide = !!(Icons as any)[displayIcon];

  return (
    <div className="animate-up max-w-4xl mx-auto pb-12">
      {/* Breadcrumb + title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/${lang}/expert/dashboard/topics`} className="text-stone-500 hover:text-slate-800 font-semibold text-sm flex items-center transition-colors">
              <ChevronLeft size={16} /> Topics
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-sm flex items-center gap-1" style={{ color: displayColor }}>
              {isDisplayLucide ? <DisplayIconComp size={14} /> : <span>{displayIcon}</span>} 
              {displayLabel}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 m-0">
            {isCustom ? "Edit Custom Topic" : "Question Editor"}
          </h2>
          <p className="text-sm font-medium text-stone-500 mt-1 flex items-center gap-2">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {isCustom && <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 uppercase tracking-wider">Custom Topic</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-stone-200 hover:border-orange-500 text-slate-700 hover:text-orange-700 font-semibold py-2 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-2" onClick={addQuestion}>
            <Plus size={18} /> Question
          </button>
          <button className={`font-semibold py-2 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 ${saved ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-orange-700 hover:bg-orange-600 text-white'}`} onClick={save}>
            {saved ? <><CheckCircle2 size={18} /> Saved!</> : <><Save size={18} /> Save All</>}
          </button>
        </div>
      </div>

      {/* Tabs (only shown for custom topics) */}
      {isCustom && (
        <div className="flex gap-2 mb-8 bg-stone-100 p-1.5 rounded-2xl w-fit border border-stone-200">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === "questions" ? "bg-white text-orange-700 shadow-sm border border-stone-200/50" : "text-stone-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <HelpCircle size={16} /> Questions
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === "details" ? "bg-white text-orange-700 shadow-sm border border-stone-200/50" : "text-stone-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Settings size={16} /> Topic Details
          </button>
        </div>
      )}

      {/* ── TOPIC DETAILS TAB (custom only) ── */}
      {isCustom && activeTab === "details" && (
        <div className="animate-up">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm mb-6">
            <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="text-orange-700" size={20} /> Topic Metadata
            </h4>

            <div className="mb-5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Topic Name</label>
              <input
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-semibold"
                value={metaLabel}
                onChange={e => setMetaLabel(e.target.value)}
                placeholder="Topic name..."
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium resize-y min-h-[80px]"
                value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)}
                placeholder="Brief description of this topic..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Icon */}
              <div className="relative" ref={emojiRef}>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Icon</label>
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-semibold"
                  onClick={() => setEmojiOpen(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    {(() => {
                      const IconComp = (Icons as any)[metaIcon] || Icons.Activity;
                      const isLucide = !!(Icons as any)[metaIcon];
                      return isLucide ? <IconComp size={20} className="text-orange-700" /> : <span className="text-xl">{metaIcon}</span>;
                    })()}
                    <span className="text-sm font-medium text-stone-600 truncate max-w-[100px]">{metaIcon}</span>
                  </span>
                  <ChevronDown size={16} className="text-stone-400" />
                </button>
                {emojiOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white border border-stone-200 rounded-2xl p-3 w-[260px] shadow-xl grid grid-cols-6 gap-2">
                    {ICON_SUGGESTIONS.map(iconName => {
                      const IconComp = (Icons as any)[iconName];
                      if (!IconComp) return null;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => { setMetaIcon(iconName); setEmojiOpen(false); }}
                          className={`flex items-center justify-center p-2 rounded-lg transition-all ${metaIcon === iconName ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-stone-500 hover:bg-stone-100 hover:text-slate-900 border border-transparent'}`}
                          title={iconName}
                        >
                          <IconComp size={20} />
                        </button>
                      );
                    })}
                    <div className="col-span-6 mt-2">
                      <input
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Type icon name or emoji..."
                        value={metaIcon}
                        onChange={e => setMetaIcon(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Accent Color</label>
                <div className="grid grid-cols-5 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setMetaColor(c)}
                      className="w-full aspect-square rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ background: c }}
                      title={c}
                    >
                      {metaColor === c && <CheckCircle2 size={14} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-2xl flex items-center gap-4 transition-colors" style={{ backgroundColor: `${metaColor}10`, borderColor: `${metaColor}30`, borderWidth: 1 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm" style={{ color: metaColor }}>
                {(() => {
                  const IconComp = (Icons as any)[metaIcon] || Icons.Activity;
                  const isLucide = !!(Icons as any)[metaIcon];
                  return isLucide ? <IconComp size={24} /> : <span className="text-2xl">{metaIcon}</span>;
                })()}
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: metaColor }}>{metaLabel || "Topic Name"}</div>
                <div className="text-xs text-stone-500 font-medium">{metaDesc || "Topic description"}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className={`font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2 ${saved ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-orange-700 hover:bg-orange-600 text-white'}`} onClick={save}>
              {saved ? <><CheckCircle2 size={18} /> Saved!</> : <><Save size={18} /> Save Details</>}
            </button>
          </div>
        </div>
      )}

      {/* ── QUESTIONS TAB ── */}
      {(!isCustom || activeTab === "questions") && (
        <div className="animate-up">
          {questions.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm mb-6">
              <HelpCircle className="text-slate-300 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Questions Yet</h3>
              <p className="text-stone-500 font-medium mb-6">Add your first diagnostic question for this topic.</p>
              <button className="bg-orange-700 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm inline-flex items-center gap-2" onClick={addQuestion}>
                <Plus size={18} /> Add First Question
              </button>
            </div>
          )}

          {questions.map((q, i) => (
            <QuestionEditor key={q.id} q={q} index={i} onChange={q => updateQ(i, q)} onDelete={() => deleteQ(i)} />
          ))}

          {questions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button className="flex-1 bg-white border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-stone-600 hover:text-orange-700 font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2" onClick={addQuestion}>
                <Plus size={20} /> Add Another Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
